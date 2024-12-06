import React from 'react';
import { Route, RouterProvider, createRoutesFromElements } from 'react-router';
import { Link, createBrowserRouter } from 'react-router-dom';
import PrimaryDashboard from './PrimaryDashboard';
import Frame from './Frame';

const router = createBrowserRouter(
  createRoutesFromElements(<>
      <Route path="/" element={<PrimaryDashboard/>}/>
      <Route path="/frame/:filter/:frameNumber" element={<Frame/>}/>
    </>)
);

function App() {
  return (
    <div className="flex flex-col min-h-screen min-w-screen bg-gradient-to-br from-pink-950 to-orange-950">
      <div className="flex flex-row z-10 p-4">
        <div className="p-3 basis-48 hidden md:inline-block">
          <img src={process.env.PUBLIC_URL + "/logo.png"} title="Quilibrium" alt="Quilibrium"/>
        </div>
        <div className="p-3 w-14 md:hidden inline-block">
          <img src={process.env.PUBLIC_URL + "/qlogo.png"} title="Quilibrium" alt="Quilibrium"/>
        </div>
        <div className="grow"></div>
        <div className="grow whitespace-nowrap text-xs md:text-base text-right text-white font-medium p-4 pr-4">
          <a href="https://www.quilibrium.com/" className="pr-2 md:pr-6 className">Main Site</a>
          <a className="hidden md:inline-block bg-white/10 text-pink-400 px-4 py-2 rounded-2xl hover:bg-slate-100 cursor-pointer transition ease-in-out duration-300" href="https://source.quilibrium.com/quilibrium/ceremonyclient">Source</a>
        </div>
      </div>
      <RouterProvider router={router}/>
    </div>
  );
}

export default App;
