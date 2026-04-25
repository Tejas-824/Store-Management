import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-7xl font-bold text-primary-600">404</p>
        <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    </div>
  );
}