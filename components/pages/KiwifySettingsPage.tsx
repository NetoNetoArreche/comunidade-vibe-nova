'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Key, Save, ExternalLink, Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface KiwifySettingsPageProps {
  user: User | null
  profile: any
}

interface KiwifySettings {
  id: string
  webhook_secret: string
  is_active: boolean
}

interface WebhookLog {
  id: string
  event_type: string
  customer_email: string
  status: string
  created_at: string
  error_message: string | null
}

export default function KiwifySettingsPage({ user, profile }: KiwifySettingsPageProps) {
  const [settings, setSettings] = useState<KiwifySettings | null>(null)
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [webhookSecret, setWebhookSecret] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadSettings()
      loadWebhookLogs()
    }
  }, [user, profile])

  async function loadSettings() {
    const { data, error } = await supabase
      .from('kiwify_settings')
      .select('*')
      .single()

    if (data) {
      setSettings(data)
      setWebhookSecret(data.webhook_secret || '')
      setIsActive(data.is_active)
    }
    
    setLoading(false)
  }

  async function loadWebhookLogs() {
    const { data, error } = await supabase
      .from('kiwify_webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setWebhookLogs(data)
    }
  }

  async function saveSettings() {
    setSaving(true)

    const settingsData = {
      webhook_secret: webhookSecret,
      is_active: isActive,
      updated_at: new Date().toISOString()
    }

    let error

    if (settings) {
      // Update existing
      const result = await supabase
        .from('kiwify_settings')
        .update(settingsData)
        .eq('id', settings.id)
      error = result.error
    } else {
      // Insert new
      const result = await supabase
        .from('kiwify_settings')
        .insert(settingsData)
      error = result.error
    }

    if (error) {
      console.error('Error saving settings:', error)
      toast.error('Erro ao salvar configurações')
    } else {
      toast.success('Configurações salvas com sucesso!')
      loadSettings()
    }

    setSaving(false)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Apenas administradores podem acessar esta página
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const webhookUrl = `${window.location.origin}/api/webhooks/kiwify`

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Integração Kiwify
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure a integração com a Kiwify para cadastro automático de clientes
        </p>
      </div>

      {/* API Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <Key className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Configuração do Webhook
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook Secret (opcional - para validação)
            </label>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="Digite um secret para validar webhooks (opcional)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use o mesmo secret configurado na Kiwify para validar os webhooks
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Integração ativa
            </label>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        {/* Webhook URL */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            URL do Webhook (configure na Kiwify):
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded text-sm text-gray-900 dark:text-white border border-blue-200 dark:border-blue-800">
              {webhookUrl}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl)
                toast.success('URL copiada!')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copiar
            </button>
          </div>
          <a
            href="https://docs.kiwify.com.br/api-reference/general"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Ver documentação da Kiwify
          </a>
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Logs de Webhooks
            </h2>
          </div>
          <button
            onClick={loadWebhookLogs}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Atualizar
          </button>
        </div>

        {webhookLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum webhook recebido ainda
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Teste o webhook na Kiwify para ver os logs aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhookLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {log.event_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {log.customer_email}
                    </p>
                    {log.error_message && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Erro: {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
          Como funciona:
        </h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-400">
          <li>Configure o webhook na Kiwify apontando para a URL fornecida acima</li>
          <li>Quando um cliente comprar, ele será cadastrado automaticamente</li>
          <li>O cliente receberá um email para criar sua senha de acesso</li>
          <li>Se houver reembolso, o acesso será removido automaticamente</li>
          <li>Todos os eventos serão registrados nos logs acima</li>
        </ul>
      </div>
    </div>
  )
}
