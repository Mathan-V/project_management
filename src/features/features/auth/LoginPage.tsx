import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useFormState } from '../../../hooks/useFormState';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/Button';
import { validateEmail, validatePassword } from '../../../utils/validators';
import { authAPI } from '../../../api/auth.api';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const { formData, errors, updateField, setError: setFieldError } = useFormState({
    user_name: '',
    email: '',
    password: '',
  });

  const validateForm = (): boolean => {
    console.log("🔍 Starting form validation...");
    let isValid = true;

    console.log("🧾 Current form data:", formData);

    // Full Name Validation
    // if (!formData.user_name.trim()) {
    //   console.warn("⚠️ Full name is missing or empty.");
    //   setFieldError('user_name', 'Please enter your full name');
    //   isValid = false;
    // } else {
    //   console.log("✅ Full name validated:", formData.user_name);
    // }

    // Email Validation
    const emailCheck = validateEmail(formData.email);
    console.log("📧 Email check result:", emailCheck, "for email:", formData.email);
    if (!emailCheck) {
      console.warn("⚠️ Invalid email address.");
      setFieldError('email', 'Please enter a valid email address');
      isValid = false;
    } else {
      console.log("✅ Email validated:", formData.email);
    }

    // Password Validation
    const passwordCheck = validatePassword(formData.password);
    console.log("🔑 Password check result:", passwordCheck, "for password:", formData.password);
    if (!passwordCheck) {
      console.warn("⚠️ Password too short or invalid.");
      setFieldError('password', 'Password must be at least 6 characters long');
      isValid = false;
    } else {
      console.log("✅ Password validated.");
    }

    console.log("🟢 Final validation result:", isValid);
    return isValid;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log(formData, "handling submit");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(formData)
      console.log("retyujhg",response)
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      window.location.reload();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col md:flex-row h-14 bg-gradient-to-r from-[#f5f3eb] via-[#f1e9d2] to-[#faf7f0]">
      {/* <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-[hsl(48.75deg_26.67%_88.24%)] to-white"> */}
      {/* Form Section */}
      <div className="w-full md:w-1/2 p-6 md:p-12 flex items-center justify-centerh-14 bg-gradient-to-l from-[#f5f3eb] via-[#f1e9d2] to-[#faf7f0]">
        <div className="w-full max-w-md space-y-6" style={{ marginLeft: '200px' }}>
          <h2 className="text-4xl font-bold text-gray-900 text-center">Create an account</h2>
          {/* <p className="text-gray-600 text-center">Sign up and get 30 day free trial</p> */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            <div>
              {/* <Input
                // label="Full name"
                type="text"
                autoComplete="name"
                required
                value={formData.user_name}
                onChange={(e) => updateField('user_name', e.target.value)}
                // error={errors.user_name}
                placeholder="Enter your full name"
                className="w-full px-6 py-8 border  rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              /> */}
            </div>
            <div>
              <Input
                // label="Email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                // error={errors.email}
                placeholder="Email"
                className="w-full px-6 py-8 border  rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label>
                Password
              </label>
              <Input
                // label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                // error={errors.password}
                placeholder="Password"
                className="w-full px-6 py-8 border  rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              {
                errors.password && <div>
                  {errors.password}
                </div>
              }
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full bg-yellow-400 text-white  py-6 rounded-full hover:bg-yellow-500 transition duration-200"
            >
              <div className='text-xl text-black'>
                Submit
              </div>
            </Button>
            <div className="text-center text-sm text-gray-600">
              Have an account? <Link to="/auth/signup" className="text-blue-600 hover:underline">Sign up</Link>
            </div>
            <div className="text-center text-sm text-gray-500">
              <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a>
            </div>
          </form>
        </div>
      </div>

      {/* Image Section */}
      <div className="w-full max-h-[98vh] my-2 md:w-1/2  rounded-2xl relative bg-gray-200 hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1553034545-32d4cd2168f1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687" // Replace with actual image path
          alt="Team working"
          className="w-full h-full   rounded-2xl object-cover"
        />
        {/* <div className="absolute top-4 right-4 bg-yellow-200 text-black p-2 rounded-md">
          Task Review With Team<br />6:00pm - 10:00pm
        </div> */}
        {/* <div className="absolute bottom-4 right-4 bg-yellow-200 text-black p-2 rounded-md">
          Daily Meeting<br />12:00pm
        </div> */}
        {/* <div className="absolute bottom-20 right-4 grid grid-cols-7 gap-1 text-sm text-black">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center">{day}</div>
          ))}
          {[12, 13, 14, 15, 16, 17, 18].map((date) => ( // Adjusted dates to match current month
            <div key={date} className="text-center">{date}</div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default LoginPage;