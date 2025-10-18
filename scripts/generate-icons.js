const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputFile = path.join(__dirname, '../public/favicon.png')
const outputDir = path.join(__dirname, '../public/icons')

// Criar diretório de ícones se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
  console.log('📁 Pasta /public/icons/ criada')
}

// Verificar se o arquivo de entrada existe
if (!fs.existsSync(inputFile)) {
  console.error('❌ Erro: favicon.png não encontrado em /public/')
  console.log('💡 Dica: Adicione seu logo como favicon.png na pasta public/')
  process.exit(1)
}

console.log('🎨 Gerando ícones PWA...\n')

// Gerar ícones em todos os tamanhos
Promise.all(
  sizes.map(size => {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`)
    
    return sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // bg-gray-900
      })
      .toFile(outputFile)
      .then(() => {
        console.log(`✅ Ícone ${size}x${size} gerado`)
        return true
      })
      .catch(err => {
        console.error(`❌ Erro ao gerar ${size}x${size}:`, err.message)
        return false
      })
  })
).then(results => {
  const successful = results.filter(r => r).length
  console.log(`\n🎉 ${successful}/${sizes.length} ícones gerados com sucesso!`)
  
  if (successful === sizes.length) {
    console.log('\n✨ Todos os ícones foram gerados!')
    console.log('📱 Seu PWA está pronto para ser instalado!')
  } else {
    console.log('\n⚠️  Alguns ícones falharam. Verifique os erros acima.')
  }
}).catch(err => {
  console.error('❌ Erro geral:', err)
  process.exit(1)
})
