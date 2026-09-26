import Foundation
import os
import RevenueCat

@MainActor
@Observable
public final class RevenueCatManager {
    public static let shared = RevenueCatManager()

    public private(set) var customerInfo: CustomerInfo?
    public private(set) var currentOffering: Offering?
    public private(set) var hasDimeMas = false
    public private(set) var isLoading = false
    public private(set) var isConfigured = false
    public var errorMessage: String?

    private var updates: Task<Void, Never>?

    public var monthlyPackage: Package? {
        guard let currentOffering else { return nil }
        if let monthly = currentOffering.monthly {
            return monthly
        }
        return currentOffering.availablePackages.first { package in
            package.packageType == .monthly
                || package.storeProduct.productIdentifier == "dime_mas_monthly"
        }
    }

    public func configureIfNeeded() {
        guard !isConfigured else { return }
        guard let apiKey = RevenueCatSecrets.apiKey else {
            errorMessage = "Dime Más needs the RevenueCat Test Store API key in Config/Secrets.xcconfig."
            return
        }

        #if DEBUG
        Purchases.logLevel = .debug
        #endif
        Purchases.configure(withAPIKey: apiKey)
        isConfigured = true
        updates = Task {
            for await info in Purchases.shared.customerInfoStream {
                apply(customerInfo: info)
            }
        }
        Task { await refresh() }
    }

    public func refresh() async {
        guard isConfigured else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let info = try await Purchases.shared.customerInfo()
            apply(customerInfo: info)
            try await loadOffering()
        } catch {
            errorMessage = "Dime Más couldn't reach RevenueCat. Please try again."
            log(error)
        }
    }

    public func purchaseMonthly() async -> Bool {
        guard let monthlyPackage else {
            errorMessage = "The dime_mas offering has no Monthly package."
            return false
        }
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await Purchases.shared.purchase(package: monthlyPackage)
            apply(customerInfo: result.customerInfo)
            if result.userCancelled {
                return false
            }
            if !hasDimeMas {
                errorMessage = "Dime Más is not active yet."
                return false
            }
            errorMessage = nil
            return true
        } catch {
            return handlePurchaseError(error)
        }
    }

    public func restore() async {
        guard isConfigured else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let info = try await Purchases.shared.restorePurchases()
            apply(customerInfo: info)
            errorMessage = hasDimeMas ? nil : "No active Dime Más purchase was found."
        } catch {
            errorMessage = "We couldn't restore Dime Más. Please try again."
            log(error)
        }
    }

    public func apply(customerInfo info: CustomerInfo) {
        customerInfo = info
        hasDimeMas = info.entitlements.all["dime_mas"]?.isActive == true
    }

    /// Unlocks only when the returned customer info has an active `dime_mas` entitlement.
    @discardableResult
    public func acceptPurchase(_ info: CustomerInfo) -> Bool {
        apply(customerInfo: info)
        guard hasDimeMas else { return false }
        errorMessage = nil
        return true
    }

    public func recordPurchaseFailure(_ error: NSError) {
        if isCancellation(error) {
            return
        }
        errorMessage = "We couldn't complete the Dime Más purchase. Please try again."
        log(error)
    }

    private func loadOffering() async throws {
        let offerings = try await Purchases.shared.offerings()
        let loadedIdentifiers = offerings.all.keys.sorted().joined(separator: ", ")
        guard let offering = offerings.all["dime_mas"] else {
            currentOffering = nil
            errorMessage = "RevenueCat offering dime_mas was not found."
            #if DEBUG
            Logger(subsystem: "app.dime.Dime", category: "dime-mas")
                .warning("Offering dime_mas missing. Loaded offerings: \(loadedIdentifiers, privacy: .public)")
            #endif
            return
        }
        currentOffering = offering
        #if DEBUG
        let packages = offering.availablePackages
            .map { "\($0.identifier):\($0.storeProduct.productIdentifier)" }
            .joined(separator: ", ")
        Logger(subsystem: "app.dime.Dime", category: "dime-mas")
            .warning("Loaded offering \(offering.identifier, privacy: .public) packages \(packages, privacy: .public) paywallData \(offering.paywall == nil ? "missing" : "present", privacy: .public) hasPaywall \(offering.hasPaywall ? "yes" : "no", privacy: .public)")
        #endif
        guard offering.monthly ?? offering.availablePackages.first(where: { $0.packageType == .monthly }) != nil else {
            errorMessage = "The dime_mas offering is missing its Monthly package."
            return
        }
        if errorMessage?.contains("dime_mas") == true || errorMessage?.contains("Monthly") == true {
            errorMessage = nil
        }
    }

    private func handlePurchaseError(_ error: Error) -> Bool {
        if isCancellation(error) {
            return false
        }
        errorMessage = "We couldn't complete the Dime Más purchase. Please try again."
        log(error)
        return false
    }

    private func isCancellation(_ error: Error) -> Bool {
        if let errorCode = error as? ErrorCode {
            return errorCode == .purchaseCancelledError
        }
        return (error as NSError).code == ErrorCode.purchaseCancelledError.rawValue
    }

    private func log(_ error: Error) {
        #if DEBUG
        Logger(subsystem: "app.dime.Dime", category: "dime-mas")
            .warning("Dime Más request failed: \(error.localizedDescription, privacy: .public)")
        #endif
    }
}

enum RevenueCatSecrets {
    static var apiKey: String? {
        let value = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !trimmed.isEmpty, !trimmed.hasPrefix("$(") else { return nil }
        return trimmed
    }
}
