import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-md text-center">
        <FiAlertCircle className="mx-auto h-16 w-16 text-secondary-400" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-5xl">
          404
        </h1>
        <p className="mt-2 text-lg text-secondary-600 dark:text-secondary-400">
          Page not found
        </p>
        <p className="mt-4 text-secondary-500 dark:text-secondary-400">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Go back
          </button>
          <button
            onClick={() => navigate('/')}
            className="ml-4 btn btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound 