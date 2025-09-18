import { SignInButton as ClerkSignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <>
      <SignedOut>
        <ClerkSignInButton>
          <Button variant="outline">Sign In</Button>
        </ClerkSignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}