// Smithery build configuration
// Override default CommonJS format to ESM to preserve import.meta.url
export default {
  esbuild: {
    format: "esm"
  }
}
