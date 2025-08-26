// app/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Brain, Shield, Zap, Target, CheckCircle, BarChart3, Users, Award } from 'lucide-react'

export default async function Home() {
  const { userId } = await auth()

  // If user is already authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">AdaptiveLearn AI</span>
          </div>
          <div className="flex space-x-4">
            <Link 
              href="/sign-up"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            AI-Powered Learning That
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Adapts to You</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Experience the world's first privacy-preserving adaptive learning platform. Powered by local AI and reinforcement learning, it personalizes your education while keeping your data private.
          </p>
          
          <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Learning for Free
            </Link>
            <Link
              href="#features"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-400 transition-all"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Key Features */}
        <section id="features" className="mb-24">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Privacy-First</h3>
              <p className="text-gray-600">
                Your data never leaves your device. Local AI ensures complete privacy while delivering personalized learning experiences.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">True Adaptation</h3>
              <p className="text-gray-600">
                Reinforcement learning tracks your confidence, learning patterns, and performance to create personalized paths.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Real-Time Intelligence</h3>
              <p className="text-gray-600">
                Local Llama 3.1 AI generates unlimited questions while adapting difficulty and topics based on your performance.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How AdaptiveLearn AI Works</h2>
            <p className="text-lg text-gray-600">Cutting-edge technology meets educational research</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Choose Your Subject",
                  desc: "Select Mathematics, Science, History, or English to begin your journey.",
                  color: "blue"
                },
                {
                  step: "2",
                  title: "AI Generates Questions",
                  desc: "Local Llama 3.1 creates contextual questions tailored to your skill level.",
                  color: "green"
                },
                {
                  step: "3",
                  title: "System Adapts",
                  desc: "RL algorithms adjust difficulty, track confidence, and optimize your path in real-time.",
                  color: "purple"
                },
                {
                  step: "4",
                  title: "Track Progress",
                  desc: "Knowledge graphs and analytics show mastery across topics.",
                  color: "orange"
                }
              ].map(({ step, title, desc, color }) => (
                <div key={step} className="flex items-start space-x-4">
                  <div className={`bg-${color}-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-${color}-600 font-bold`}>{step}</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">{title}</h4>
                    <p className="text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-10 shadow-md">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-800">Real-Time Analytics</h4>
                  <p className="text-sm text-gray-600">Track performance</p>
                </div>
                <div>
                  <Brain className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-800">AI-Powered</h4>
                  <p className="text-sm text-gray-600">Local processing</p>
                </div>
                <div>
                  <Target className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-800">Adaptive Learning</h4>
                  <p className="text-sm text-gray-600">Personalized scaling</p>
                </div>
                <div>
                  <Shield className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-800">Privacy First</h4>
                  <p className="text-sm text-gray-600">Data stays local</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Different */}
        <section className="mb-24">
          <div className="bg-white rounded-2xl p-12 shadow-md">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Why AdaptiveLearn AI is Different</h2>
              <p className="text-lg text-gray-600">Solving the three biggest problems in educational technology</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <div className="text-center">
                <div className="bg-red-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Traditional Platforms</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Fixed difficulty</li>
                  <li>• Static questions</li>
                  <li>• No personalization</li>
                  <li>• Privacy concerns</li>
                </ul>
              </div>

              <div className="text-center">
                <div className="bg-yellow-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Our Innovation</h3>
                <ul className="space-y-2 text-green-600">
                  <li><CheckCircle className="inline h-4 w-4 mr-1" /> Real-time adaptation</li>
                  <li><CheckCircle className="inline h-4 w-4 mr-1" /> Unlimited AI questions</li>
                  <li><CheckCircle className="inline h-4 w-4 mr-1" /> Personalization</li>
                  <li><CheckCircle className="inline h-4 w-4 mr-1" /> Privacy-first</li>
                </ul>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Results</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Faster progress</li>
                  <li>• Better retention</li>
                  <li>• More confidence</li>
                  <li>• Personalized paths</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white shadow-md">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join the future of education with AI that adapts to you, not the other way around.
          </p>
          <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
            <Link
              href="/sign-up"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </Link>
            <p className="text-sm opacity-75">No credit card required • Privacy guaranteed</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-200 mt-20">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-800">AdaptiveLearn AI</span>
          </div>
          <p className="text-sm text-gray-600 text-center sm:text-right">
            Built with privacy, powered by AI, designed for learning.
          </p>
        </div>
      </footer>
    </div>
  )
}
