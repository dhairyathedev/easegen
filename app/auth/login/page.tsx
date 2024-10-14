import AuthForm from '@/components/auth-form'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-16 lg:p-24">
        <AuthForm />
    </main>
  )
}