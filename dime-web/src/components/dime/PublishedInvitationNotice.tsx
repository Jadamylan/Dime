import { Button } from "@/components/ui/button";
import { PUBLIC_URL } from "@/config/publicUrl";

export function PublishedInvitationNotice() {
  return (
    <div className="flex flex-col items-center gap-4 text-center" lang="en">
      <p role="status" className="text-lg">
        Open the published Dime app to create a guest invitation
      </p>
      <Button asChild className="tap h-auto whitespace-normal rounded-full px-6 py-4 text-lg">
        <a href={PUBLIC_URL} target="_blank" rel="noopener noreferrer">Open published Dime</a>
      </Button>
    </div>
  );
}