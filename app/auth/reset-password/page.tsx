'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setEmailSent(true)
      toast.success('Email de recuperação enviado!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center pt-8 pb-6">
          <Logo size="medium" showText={false} />
        </div>
        
        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Recuperar Senha
          </h2>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            Digite seu email para receber instruções
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200">
                  ✅ Email enviado com sucesso!
                </p>
                <p className="text-sm text-green-600 dark:text-green-300 mt-2">
                  Verifique sua caixa de entrada e siga as instruções para criar uma nova senha.
                </p>
              </div>
              
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Enviar novamente
              </button>
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/"
              className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
