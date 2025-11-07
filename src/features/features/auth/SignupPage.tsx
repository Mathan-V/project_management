import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormState } from '../../../hooks/useFormState';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { validateEmail, validatePassword, validateRequired } from '../../../utils/validators';
import { authAPI } from '../../../api/auth.api';

const SignupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);


  const { formData, errors, updateField, setError: setFieldError } = useFormState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_id: '',
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await authAPI.getAllRoles(); 
        const formattedRoles = data.map((role: any) => ({
          value: role.id, 
          label: role.name,
        }));
        setRoles(formattedRoles);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };

    fetchRoles();
  }, []);



  const validateForm = (): boolean => {
    let isValid = true;

    if (!validateRequired(formData.name)) {
      setFieldError('name', 'Name is required');
      isValid = false;
    }

    if (!validateEmail(formData.email)) {
      setFieldError('email', 'Please enter a valid email address');
      isValid = false;
    }

    if (!validatePassword(formData.password)) {
      setFieldError('password', 'Password must be at least 6 characters long');
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      isValid = false;
    }

    return isValid;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDatas = {
        user_name: formData.name,
        email: formData.email,
        password: formData.password,
        role_id: Number(formData.role_id),
      };
      const response = await authAPI.signup(formDatas);
      localStorage.setItem('access_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Sign Up</h3>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Input
                label="Full Name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
                placeholder="Enter your full name"
              />

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={errors.email}
                placeholder="Enter your email"
              />

              <Select
                label="Role"
                value={formData.role_id}
                onChange={(e) => updateField('role_id', e.target.value)} 
                options={roles.length > 0 ? roles : [{ value: '', label: 'Loading...' }]}
              />



              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                error={errors.password}
                placeholder="Enter your password"
              />

              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition duration-200"
              >
                Create Account
              </Button>

              <div className="text-sm text-center">
                <span className="text-gray-600">Already have an account? </span>
                <Link
                  to="/auth/login"
                  className="inline-block w-full text-center bg-amber-700 hover:bg-amber-800 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Sign in
                </Link>

              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;