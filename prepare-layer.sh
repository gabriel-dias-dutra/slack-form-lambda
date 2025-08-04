#!/bin/bash

# Script para preparar o layer com node_modules para AWS Lambda

echo "🔄 Preparando Lambda Layer com node_modules..."

# Remove diretório layer existente
rm -rf layer

# Cria estrutura necessária para o layer
mkdir -p layer/nodejs

# Copia package.json e package-lock.json
cp package.json layer/nodejs/
cp package-lock.json layer/nodejs/ 2>/dev/null || cp yarn.lock layer/nodejs/ 2>/dev/null

# Entra no diretório e instala dependências de produção
cd layer/nodejs
yarn install --production

# Remove arquivos desnecessários para reduzir tamanho
find . -name "*.md" -type f -delete
find . -name "*.txt" -type f -delete
find . -name ".git" -type d -exec rm -rf {} + 2>/dev/null
find . -name "test" -type d -exec rm -rf {} + 2>/dev/null
find . -name "tests" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.map" -type f -delete

cd ../..

echo "✅ Layer preparado em ./layer/"
echo "📦 Estrutura: layer/nodejs/node_modules/"
