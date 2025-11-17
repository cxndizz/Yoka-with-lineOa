// This page is intended to be used as LIFF entry from LINE OA Rich Menu.
// In a real implementation, you would:
// 1. Load LIFF SDK
// 2. Initialize with your LIFF ID
// 3. Get LINE user profile
// 4. Call /api/auth/line with that profile
// 5. Redirect user into the main booking page (e.g., /branches or /classes)
export default function LiffEntryPage() {
  return (
    <main>
      <h1>LIFF entry placeholder</h1>
      <p>
        Implement LINE LIFF initialization on this page using the LIFF JavaScript SDK. After
        obtaining the user profile, send it to <code>/api/auth/line</code> and then redirect
        the user to the booking flow.
      </p>
    </main>
  );
}
