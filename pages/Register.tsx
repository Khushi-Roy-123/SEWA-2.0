import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      dob: '',
      phone: '',
      address: '',
      bloodGroup: '',
      allergies: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          dob: formData.dob,
          phone: formData.phone,
          address: formData.address,
          bloodGroup: formData.bloodGroup,
          allergies: formData.allergies,
          emergencyContact: {
              name: formData.emergencyContactName,
              relationship: formData.emergencyContactRelation,
              phone: formData.emergencyContactPhone
          }
      };

      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const registerData = await response.json();

      if (!response.ok) {
        throw new Error(registerData || 'Registration failed');
      }

      // Automatically login after register
      const loginResponse = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      
      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
         window.location.hash = '#/login';
         return;
      }
      
      login(loginData.token, loginData.user);
      window.location.hash = '#/'; // Redirect to dashboard

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a href="#/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              sign in to existing account
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input id="name" name="name" type="text" required className={`${inputClasses} rounded-t-md`} placeholder="Full Name" value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input id="email" name="email" type="email" required className={inputClasses} placeholder="Email address" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" required className={inputClasses} placeholder="Password" value={formData.password} onChange={handleChange} />
            </div>
            
            <div className="pt-4 pb-2"><h3 className="text-sm font-medium text-gray-700">Personal & Medical Info</h3></div>
             <div>
              <label htmlFor="dob" className="sr-only">Date of Birth</label>
              <input id="dob" name="dob" type="text" className={inputClasses} placeholder="Date of Birth (YYYY-MM-DD)" value={formData.dob} onChange={handleChange} />
            </div>
             <div>
              <label htmlFor="phone" className="sr-only">Phone Number</label>
              <input id="phone" name="phone" type="tel" className={inputClasses} placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="address" className="sr-only">Address</label>
              <input id="address" name="address" type="text" className={inputClasses} placeholder="Address" value={formData.address} onChange={handleChange} />
            </div>
             <div>
              <label htmlFor="bloodGroup" className="sr-only">Blood Group</label>
              <input id="bloodGroup" name="bloodGroup" type="text" className={inputClasses} placeholder="Blood Group (e.g. O+)" value={formData.bloodGroup} onChange={handleChange} />
            </div>
             <div>
              <label htmlFor="allergies" className="sr-only">Allergies</label>
              <input id="allergies" name="allergies" type="text" className={inputClasses} placeholder="Allergies (comma separated)" value={formData.allergies} onChange={handleChange} />
            </div>

             <div className="pt-4 pb-2"><h3 className="text-sm font-medium text-gray-700">Emergency Contact</h3></div>
             <div>
              <label htmlFor="ecName" className="sr-only">Contact Name</label>
              <input id="ecName" name="emergencyContactName" type="text" className={inputClasses} placeholder="Emergency Contact Name" value={formData.emergencyContactName} onChange={handleChange} />
            </div>
             <div>
              <label htmlFor="ecRel" className="sr-only">Relationship</label>
              <input id="ecRel" name="emergencyContactRelation" type="text" className={inputClasses} placeholder="Relationship" value={formData.emergencyContactRelation} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="ecPhone" className="sr-only">Contact Phone</label>
              <input id="ecPhone" name="emergencyContactPhone" type="tel" className={`${inputClasses} rounded-b-md`} placeholder="Contact Phone" value={formData.emergencyContactPhone} onChange={handleChange} />
            </div>

          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
