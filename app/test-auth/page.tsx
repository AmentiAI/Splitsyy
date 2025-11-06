"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestAuthPage() {
  const [results, setResults] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const addResult = (msg: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testSupabaseConnection = async () => {
    addResult("Testing Supabase connection...");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult(`❌ Session error: ${error.message}`);
      } else {
        addResult(`✅ Session check: ${data.session ? "Has session" : "No session"}`);
      }
    } catch (err) {
      addResult(`❌ Connection error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  const testLoginAPI = async () => {
    if (!email || !password) {
      addResult("❌ Please enter email and password");
      return;
    }

    addResult(`Testing login API with ${email}...`);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      addResult(`Response status: ${response.status}`);
      addResult(`Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addResult("✅ Login API call successful");
      } else {
        addResult(`❌ Login failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      addResult(`❌ API call error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  const testRegisterAPI = async () => {
    if (!email || !password) {
      addResult("❌ Please enter email and password");
      return;
    }

    addResult(`Testing register API with ${email}...`);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          name: "Test User" 
        }),
        credentials: "include",
      });

      const data = await response.json();
      addResult(`Response status: ${response.status}`);
      addResult(`Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addResult("✅ Register API call successful");
      } else {
        addResult(`❌ Register failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      addResult(`❌ API call error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  const checkEnvVars = () => {
    addResult("Checking environment variables...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    addResult(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅ Set" : "❌ Missing"}`);
    addResult(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? "✅ Set" : "❌ Missing"}`);
    
    if (supabaseUrl) {
      addResult(`URL: ${supabaseUrl.substring(0, 30)}...`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Auth Diagnostic Tool</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Inputs</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="password123"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={checkEnvVars}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Check Env Vars
            </button>
            <button
              onClick={testSupabaseConnection}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Supabase Connection
            </button>
            <button
              onClick={testLoginAPI}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test Login API
            </button>
            <button
              onClick={testRegisterAPI}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Test Register API
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-gray-500">No tests run yet...</div>
            ) : (
              results.map((result, i) => (
                <div key={i} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setResults([])}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>
    </div>
  );
}

