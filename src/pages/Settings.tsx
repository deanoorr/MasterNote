import { useState, useEffect } from 'react'
import { FiSave, FiMoon, FiSun, FiCheck, FiX, FiKey, FiCpu, FiTag, FiClock, FiFlag } from 'react-icons/fi'
import { useAppSelector, useAppDispatch } from '@hooks/useAppRedux'
import { setThemeMode } from '@features/theme/themeSlice'
import { 
  updateAISettings, 
  toggleFeature,
  AIProvider
} from '@features/aiSettings/aiSettingsSlice'

const Settings = () => {
  const dispatch = useAppDispatch()
  const { mode } = useAppSelector(state => state.theme)
  const aiSettings = useAppSelector(state => state.aiSettings)
  const isDarkMode = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState<AIProvider>(AIProvider.OPENAI)
  const [model, setModel] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Load existing API key on component mount
  useEffect(() => {
    setApiKey(aiSettings.apiKey || '')
    setProvider(aiSettings.provider as AIProvider)
    setModel(aiSettings.model || '')
  }, [aiSettings])
  
  const handleSaveAISettings = () => {
    dispatch(updateAISettings({
      apiKey,
      provider,
      model,
    }))
    
    setSaveSuccess(true)
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }
  
  const handleToggleFeature = (feature: keyof typeof aiSettings.features) => {
    dispatch(toggleFeature(feature))
  }
  
  const handleToggleTheme = () => {
    dispatch(setThemeMode(isDarkMode ? 'light' : 'dark'))
  }
  
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
            App Settings
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-3">Theme</h3>
              <div className="flex items-center">
                <button
                  onClick={handleToggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    isDarkMode ? 'bg-primary-600' : 'bg-secondary-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  <span className="sr-only">Toggle Theme</span>
                </button>
                <span className="ml-3 text-secondary-700 dark:text-secondary-300">
                  {isDarkMode ? (
                    <><FiMoon className="inline mr-1" /> Dark Mode</>
                  ) : (
                    <><FiSun className="inline mr-1" /> Light Mode</>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
            AI Integration Settings
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                AI Provider
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="input w-full"
              >
                <option value={AIProvider.OPENAI}>OpenAI</option>
                <option value={AIProvider.ANTHROPIC}>Anthropic</option>
                <option value={AIProvider.GOOGLE}>Google AI</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                AI Model
              </label>
              <input
                type="text"
                id="model"
                placeholder={provider === AIProvider.OPENAI ? "gpt-4o" : provider === AIProvider.ANTHROPIC ? "claude-3-opus" : "gemini-pro"}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input w-full"
              />
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                Leave blank to use the default model for the selected provider
              </p>
            </div>
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                API Key
              </label>
              <div className="flex">
                <div className="relative flex-grow">
                  <input
                    type={showApiKey ? "text" : "password"}
                    id="apiKey"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="input w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    <FiKey className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>
            
            <button
              onClick={handleSaveAISettings}
              className="btn btn-primary flex items-center"
            >
              <FiSave className="mr-2" />
              Save API Settings
            </button>
            
            {saveSuccess && (
              <div className="mt-2 text-green-600 dark:text-green-400 text-sm flex items-center">
                <FiCheck className="mr-1" /> Settings saved successfully
              </div>
            )}
          </div>
        </div>
        
        {/* AI Features */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
            AI Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="taskCategorization"
                  type="checkbox"
                  checked={aiSettings.features.taskCategorization}
                  onChange={() => handleToggleFeature('taskCategorization')}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="taskCategorization"
                  className="font-medium text-secondary-900 dark:text-white flex items-center"
                >
                  <FiTag className="mr-2" /> Task Categorization
                </label>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Automatically suggest tags and categories for tasks based on their descriptions
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="prioritization"
                  type="checkbox"
                  checked={aiSettings.features.prioritization}
                  onChange={() => handleToggleFeature('prioritization')}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="prioritization"
                  className="font-medium text-secondary-900 dark:text-white flex items-center"
                >
                  <FiFlag className="mr-2" /> Smart Prioritization
                </label>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Automatically determine the appropriate priority for tasks
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="suggestions"
                  type="checkbox"
                  checked={aiSettings.features.suggestions}
                  onChange={() => handleToggleFeature('suggestions')}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="suggestions"
                  className="font-medium text-secondary-900 dark:text-white flex items-center"
                >
                  <FiClock className="mr-2" /> Deadline Suggestions
                </label>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Suggest reasonable deadlines for tasks based on their descriptions
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="taskCreation"
                  type="checkbox"
                  checked={aiSettings.features.taskCreation || false}
                  onChange={() => handleToggleFeature('taskCreation')}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="taskCreation"
                  className="font-medium text-secondary-900 dark:text-white flex items-center"
                >
                  <FiCpu className="mr-2" /> Natural Language Task Creation
                </label>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Create tasks using natural language via the AI Assistant
                </p>
              </div>
            </div>
          </div>
          
          {!aiSettings.apiKey ? (
            <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-300">
              <div className="flex">
                <FiX className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 flex-shrink-0" />
                <p>To enable AI features, please add your API key in the settings above.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 border border-green-300 bg-green-50 dark:bg-green-900/30 dark:border-green-800 rounded-md text-green-800 dark:text-green-300">
              <div className="flex">
                <FiCheck className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 flex-shrink-0" />
                <p>AI features are enabled! Select which features you want to use above.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings 