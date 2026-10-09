import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const envContents = await readFile(resolve(".env"), "utf8").catch((error) => {
  if (error.code === "ENOENT") return ""
  throw error
})
const localApiUrl = envContents
  .split(/\r?\n/)
  .map((line) => line.match(/^\s*QUACKROOM_API_URL\s*=\s*(.*?)\s*$/)?.[1])
  .find((value) => value !== undefined)
  ?.replace(/^(["'])(.*)\1$/, "$2")
const apiUrl = process.env.QUACKROOM_API_URL ?? localApiUrl ?? "/api"

let configApiUrl
if (apiUrl === "/api") {
  configApiUrl = apiUrl
} else {
  let parsedUrl
  try {
    parsedUrl = new URL(apiUrl)
  } catch {
    throw new Error("QUACKROOM_API_URL debe ser /api o una URL absoluta válida.")
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("QUACKROOM_API_URL debe usar HTTP o HTTPS.")
  }
  if (!parsedUrl.pathname.replace(/\/+$/, "").endsWith("/api")) {
    throw new Error("QUACKROOM_API_URL debe terminar en /api.")
  }
  configApiUrl = apiUrl.replace(/\/+$/, "")
}

const configPath = resolve(
  "dist",
  "quackroom-frontend",
  "browser",
  "runtime-config.js",
)
await mkdir(resolve("dist", "quackroom-frontend", "browser"), {
  recursive: true,
})
await writeFile(
  configPath,
  `window.QUACKROOM_CONFIG = ${JSON.stringify({ apiUrl: configApiUrl })};\n`,
)
console.log(`API configurada para esta compilación: ${configApiUrl}`)
