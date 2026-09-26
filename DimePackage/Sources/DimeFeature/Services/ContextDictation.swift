import AVFoundation
import Foundation
import os
import Speech

@MainActor
@Observable
final class ContextDictation {
    private(set) var isListening = false
    private(set) var transcript = ""
    private(set) var message: String?

    private var analyzer: SpeechAnalyzer?
    private var inputProvider: CaptureInputSequenceProvider?
    private var engine: AVAudioEngine?
    private var forwarder: PCMForwarder?
    private var tapInstalled = false
    private var analysisTask: Task<Void, Never>?
    private var resultsTask: Task<Void, Never>?
    private var finalizedTranscript = ""

    func toggle() async {
        if isListening {
            await stop()
        } else {
            await start()
        }
    }

    func start() async {
        message = nil
        finalizedTranscript = ""
        transcript = ""

        let speechAllowed = await Self.requestSpeechAccess()
        let microphoneAllowed = await Self.requestMicrophoneAccess()
        guard speechAllowed, microphoneAllowed else {
            message = "The microphone isn’t available. You can type instead."
            return
        }

        let transcriber = DictationTranscriber(
            locale: Locale(identifier: "en-US"),
            contentHints: [],
            transcriptionOptions: [],
            reportingOptions: [.volatileResults],
            attributeOptions: []
        )

        do {
            if let installation = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
                message = "Getting speech ready…"
                try await installation.downloadAndInstall()
                message = nil
            }

            let analyzer = SpeechAnalyzer(
                modules: [transcriber],
                options: SpeechAnalyzer.Options(priority: .userInitiated, modelRetention: .whileInUse)
            )
            try await analyzer.prepareToAnalyze(in: nil)
            self.analyzer = analyzer
            watchResults(transcriber)

            if let device = AVCaptureDevice.default(for: .audio),
               let provider = try? await CaptureInputSequenceProvider.providerWithSession(
                   from: device,
                   compatibleWith: [transcriber]
               ) {
                inputProvider = provider
                Self.startCaptureIfNeeded(provider.captureSession)
                isListening = true
                watchAnalysis(analyzer, inputs: provider.analyzerInputs)
            } else {
                try await startEngineDictation(analyzer, transcriber: transcriber)
            }
        } catch {
            Self.log(error)
            message = "Speech isn’t available. You can type instead."
            await stop()
        }
    }

    func stop() async {
        isListening = false
        if let session = inputProvider?.captureSession {
            Self.stopCapture(session)
        }
        if let engine {
            if engine.isRunning {
                engine.stop()
            }
            if tapInstalled {
                engine.inputNode.removeTap(onBus: 0)
                tapInstalled = false
            }
        }
        forwarder?.finish()
        forwarder = nil
        engine = nil
        await analyzer?.cancelAndFinishNow()
        analysisTask?.cancel()
        resultsTask?.cancel()
        analysisTask = nil
        resultsTask = nil
        analyzer = nil
        inputProvider = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func startEngineDictation(
        _ analyzer: SpeechAnalyzer,
        transcriber: DictationTranscriber
    ) async throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker])
        try audioSession.setActive(true)

        let converter = try await AnalyzerInputConverter.converter(compatibleWith: [transcriber])
        let engine = AVAudioEngine()
        var continuation: AsyncStream<AnalyzerInput>.Continuation?
        let stream = AsyncStream<AnalyzerInput> { continuation = $0 }
        guard let continuation else { throw DictationError.unavailable }

        let forwarder = PCMForwarder(converter: converter, continuation: continuation)
        try Self.startEngine(engine, forwarder: forwarder)
        self.engine = engine
        self.forwarder = forwarder
        tapInstalled = true
        isListening = true
        watchAnalysis(analyzer, inputs: stream)
    }

    private func watchResults(_ transcriber: DictationTranscriber) {
        resultsTask = Task { [weak self] in
            do {
                for try await result in transcriber.results {
                    let text = String(result.text.characters)
                    let isFinal = result.isFinal
                    await MainActor.run {
                        self?.apply(text: text, isFinal: isFinal)
                    }
                }
            } catch is CancellationError {
                return
            } catch {
                await MainActor.run {
                    guard let self, self.isListening, self.transcript.isEmpty else { return }
                    Self.log(error)
                    self.message = "Speech isn’t available. You can type instead."
                    self.isListening = false
                }
            }
        }
    }

    private func watchAnalysis<Inputs: AsyncSequence & Sendable>(
        _ analyzer: SpeechAnalyzer,
        inputs: Inputs
    ) where Inputs.Element == AnalyzerInput {
        analysisTask = Task { [weak self] in
            do {
                try await analyzer.start(inputSequence: inputs)
            } catch is CancellationError {
                return
            } catch {
                await MainActor.run {
                    guard let self, self.isListening, self.transcript.isEmpty else { return }
                    Self.log(error)
                    self.message = "Speech isn’t available. You can type instead."
                    self.isListening = false
                }
            }
        }
    }

    private func apply(text: String, isFinal: Bool) {
        let piece = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !piece.isEmpty else { return }
        if isFinal {
            if finalizedTranscript.isEmpty {
                finalizedTranscript = piece
            } else {
                finalizedTranscript += " \(piece)"
            }
            transcript = finalizedTranscript
        } else if finalizedTranscript.isEmpty {
            transcript = piece
        } else {
            transcript = "\(finalizedTranscript) \(piece)"
        }
    }

    private nonisolated static func requestSpeechAccess() async -> Bool {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
    }

    private nonisolated static func requestMicrophoneAccess() async -> Bool {
        await withCheckedContinuation { continuation in
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                continuation.resume(returning: granted)
            }
        }
    }

    private nonisolated static func startCaptureIfNeeded(_ session: AVCaptureSession) {
        guard !session.isRunning else { return }
        session.startRunning()
    }

    private nonisolated static func stopCapture(_ session: AVCaptureSession) {
        guard session.isRunning else { return }
        session.stopRunning()
    }

    private nonisolated static func startEngine(
        _ engine: AVAudioEngine,
        forwarder: PCMForwarder
    ) throws {
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        guard format.sampleRate > 0, format.channelCount > 0 else {
            throw DictationError.unavailable
        }
        input.installTap(onBus: 0, bufferSize: 4096, format: format) { buffer, time in
            forwarder.append(buffer, time: time)
        }
        engine.prepare()
        try engine.start()
    }

    private nonisolated static func log(_ error: Error) {
        Logger(subsystem: "app.dime.Dime", category: "dictation")
            .error("\(error.localizedDescription, privacy: .public)")
    }
}

private final class PCMForwarder: @unchecked Sendable {
    private let converter: AnalyzerInputConverter
    private let continuation: AsyncStream<AnalyzerInput>.Continuation

    init(converter: AnalyzerInputConverter, continuation: AsyncStream<AnalyzerInput>.Continuation) {
        self.converter = converter
        self.continuation = continuation
    }

    func append(_ buffer: AVAudioPCMBuffer, time: AVAudioTime) {
        guard let inputs = try? converter.convert(buffer, at: time) else { return }
        for input in inputs {
            continuation.yield(input)
        }
    }

    func finish() {
        if let tail = try? converter.flush() {
            for input in tail {
                continuation.yield(input)
            }
        }
        continuation.finish()
    }
}

private enum DictationError: Error {
    case unavailable
}
