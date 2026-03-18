/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SimuladorGrid } from './components/SimuladorGrid';
import { Dashboard } from './components/Dashboard';
import { Colaboradores } from './components/Colaboradores';
import { Config } from './components/Config';
import { ColaboradoresProvider } from './contexts/ColaboradoresContext';

export default function App() {
  return (
    <ColaboradoresProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="simulador" element={<SimuladorGrid />} />
            <Route path="colaboradores" element={<Colaboradores />} />
            <Route path="config" element={<Config />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ColaboradoresProvider>
  );
}
