import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * RegisterPage - Placeholder page for registration
 * Will be implemented in future phases with full form
 */
export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Register</h1>
          <p className="text-gray-600 mb-6">Create your PortionBridge account</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Registration page will be implemented in a future phase.
              For now, please use the landing page navigation.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
