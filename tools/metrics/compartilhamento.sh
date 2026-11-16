#!/usr/bin/env bash
# Compartilhamento de código: comum / (comum + específico Android + específico iOS), com cloc por arquivo.
source "$(dirname "$0")/_comum.sh"

if ! command -v cloc >/dev/null; then
  echo "cloc não encontrado. Instale com 'npm install -g cloc' ou 'choco install cloc'." >&2
  exit 1
fi

saida="$RAIZ/tools/metrics/out"
mkdir -p "$saida"
lista="$saida/compartilhamento-arquivos.txt"
relatorio="$saida/compartilhamento-cloc.csv"

git grep -I -l -e '' -- "${CAMINHOS_PRODUTO[@]}" "${EXCLUSOES_GERADOS[@]}" 2>/dev/null \
  | grep -E '\.(ts|tsx|js|jsx|kt|java|swift|m|mm|h)$' > "$lista" || true

if [ ! -s "$lista" ]; then
  echo "Nenhum arquivo TypeScript, JavaScript, Kotlin, Java ou Swift versionado nas pastas de produto."
  exit 0
fi

cloc --by-file --csv --quiet --list-file="$lista" --report-file="$relatorio" >/dev/null

resultado=$(awk -F, '
  function categoria(f) {
    if (f ~ /(^|\/)__tests__\// || f ~ /\.(test|spec)\.[jt]sx?$/) return "testes"
    if (f ~ /^android\// || f ~ /\.android\.[jt]sx?$/) return "android"
    if (f ~ /^ios\// || f ~ /\.ios\.[jt]sx?$/) return "ios"
    if (f ~ /^src\// || f == "App.tsx" || f == "index.js") return "comum"
    return "outros"
  }
  NR>1 && $1 != "SUM" { c[categoria($2)] += $5 }
  END {
    total = c["comum"] + c["android"] + c["ios"]
    printf "comum %d\nandroid %d\nios %d\ntestes %d\noutros %d\n", c["comum"], c["android"], c["ios"], c["testes"], c["outros"]
    printf "compartilhamento %.1f%%\n", (total ? 100*c["comum"]/total : 0)
  }' "$relatorio")

js_produto=$(grep -E '\.[jt]sx?$' "$lista" | grep -Ev '(^|/)__tests__/|\.(test|spec)\.[jt]sx?$' || true)
arquivos_plataforma=$(echo "$js_produto" | grep -E '\.(android|ios)\.[jt]sx?$' || true)
n_arquivos=$(echo "$arquivos_plataforma" | grep -c . || true)
n_platform=0
if [ -n "$js_produto" ]; then
  n_platform=$(echo "$js_produto" | tr '\n' '\0' | xargs -0 grep -Eho 'Platform\.(OS|select)' 2>/dev/null | wc -l | tr -d ' ')
fi

echo "Linhas de código (cloc, coluna code):"
echo "$resultado"
echo "arquivos_plataforma $n_arquivos"
echo "platform_os_select $n_platform"
echo ""
echo "Arquivos por plataforma e com Platform.OS ou Platform.select (usar para mapear telas com integração nativa):"
{
  [ -n "$arquivos_plataforma" ] && echo "$arquivos_plataforma"
  [ -n "$js_produto" ] && echo "$js_produto" | tr '\n' '\0' | xargs -0 grep -El 'Platform\.(OS|select)' 2>/dev/null
} | sort -u | grep . || echo "(nenhum)"
echo ""
echo "Detalhe por arquivo: $relatorio"

v() { echo "$resultado" | awk -v k="$1" '$1==k{print $2}'; }
registrar_csv "compartilhamento.csv" "data,commit,comum,android,ios,testes,compartilhamento_pct,arquivos_plataforma,platform_os_select" \
  "$(agora),$(commit_atual),$(v comum),$(v android),$(v ios),$(v testes),$(v compartilhamento | tr -d '%'),$n_arquivos,$n_platform"
