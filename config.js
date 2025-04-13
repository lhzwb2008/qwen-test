// Load API key from .config file
(function() {
  // This is a simple client-side config loader
  // In a production environment, you would handle this server-side
  
  async function loadConfig() {
    try {
      const response = await fetch('.config');
      const configText = await response.text();
      
      // Parse the config file (simple key=value format)
      const configLines = configText.split('\n');
      const config = {};
      
      configLines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            config[key.trim()] = value.trim();
          }
        }
      });
      
      // Store in window object for access by other scripts
      window.appConfig = config;
      
      // Check if API key is set
      if (!config.DASHSCOPE_API_KEY || config.DASHSCOPE_API_KEY === 'your_api_key_here') {
        console.warn('API key not set. Please update the .config file with your DashScope API key.');
        document.getElementById('api-key-warning').style.display = 'block';
      }
      
      return config;
    } catch (error) {
      console.error('Failed to load config:', error);
      document.getElementById('api-key-warning').style.display = 'block';
      return {};
    }
  }
  
  // Load config when the page loads
  window.addEventListener('DOMContentLoaded', loadConfig);
})();
