import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-3xl font-bold text-green-400">Reasonote</div>
        <nav>
          <Link href="/app/login" className="text-green-400 hover:text-green-300">Log In</Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center mb-8 text-white">
          Learn Anything with AI-Powered Personalized Lessons
        </h1>
        <p className="text-xl text-center mb-12 max-w-2xl mx-auto text-gray-300">
          Reasonote adapts to your learning style, creating customized lessons and AI-generated podcasts to help you master any subject.
        </p>
        
        <div className="flex justify-center mb-16">
          <Link href="/app/login" className="bg-green-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-600 transition duration-300">
            Get Started for Free
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">Customized Lessons That Change With You</h2>
            <p className="text-gray-300">Our AI analyzes your progress and adapts lessons in real-time, ensuring you're always challenged at the right level.</p>
          </div>
          <div className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">Personalized AI-Generated Podcasts</h2>
            <p className="text-gray-300">Learn on the go with podcasts tailored to your interests and learning goals, created by advanced AI technology.</p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-400">
        © 2024 Reasonote. All rights reserved.
        <div className="mt-2">
          <Link href="/app/privacy" className="text-green-400 hover:text-green-300 text-sm">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}
