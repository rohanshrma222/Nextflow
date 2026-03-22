import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101010] px-4">
      <SignIn />
    </main>
  )
}
