'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Chrome, Apple } from 'lucide-react'
import toast from 'react-hot-toast'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Verificar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Verificar se já foi instalado antes
    const hasInstalledBefore = localStorage.getItem('pwa-installed')
    const hasDismissedPrompt = localStorage.getItem('pwa-prompt-dismissed')

    if (standalone || hasInstalledBefore) {
      return
    }

    // Listener para o evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Mostrar prompt após 10 segundos se não foi dispensado
      if (!hasDismissedPrompt) {
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 10000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listener para quando o app for instalado
    window.addEventListener('appinstalled', () => {
      console.log('PWA instalado com sucesso!')
      localStorage.setItem('pwa-installed', 'true')
      setShowInstallPrompt(false)
      toast.success('App instalado com sucesso! 🎉')
    })

    // Para iOS, mostrar instruções após 10 segundos
    if (iOS && !standalone && !hasDismissedPrompt) {
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 10000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return
    }

    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA')
        localStorage.setItem('pwa-installed', 'true')
      } else {
        console.log('Usuário recusou instalar o PWA')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
    
    // Permitir mostrar novamente após 7 dias
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  if (isStandalone || !showInstallPrompt) {
    return null
  }

  return (
    <>
      {/* Prompt Principal */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-primary-500 z-50 animate-slide-up">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg">
                <Smartphone className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Instalar App
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Acesso rápido e offline
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Benefícios */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Acesso instantâneo pela tela inicial
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Funciona offline
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-500 mr-2">✓</span>
              Notificações em tempo real
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              {isIOS ? 'Ver Instruções' : 'Instalar Agora'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Depois
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Instruções iOS */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Apple className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Instalar no iOS
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowIOSInstructions(false)
                    setShowInstallPrompt(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      Toque no botão de compartilhar
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No Safari, toque no ícone de compartilhar (quadrado com seta para cima)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      Adicionar à Tela de Início
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Role para baixo e selecione "Adicionar à Tela de Início"
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      Confirmar
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Toque em "Adicionar" no canto superior direito
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowIOSInstructions(false)
                  setShowInstallPrompt(false)
                }}
                className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Entendi!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
