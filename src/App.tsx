import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./routes/Login";
import { Today } from "./routes/Today";
import { Week } from "./routes/Week";
import { Habits } from "./routes/Habits";
import { History } from "./routes/History";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Today />} />
                <Route path="/week" element={<Week />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/history" element={<History />} />
                {/* a antiga aba "Horário" virou a visão em grade dentro de "Semana" */}
                <Route path="/schedule" element={<Navigate to="/week" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
