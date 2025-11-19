import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css';
import Home from './views/Home.jsx';
import App from './App.jsx';
import Server_con_cola from './views/Server_con_cola.jsx';
import Server_sin_cola from './views/Server_sin_cola.jsx';
import Manual from './views/Manual.jsx';
import AsistenteVirtual from './views/AsistenteVirtual.jsx';
import Server_con_cola_av from './views/Sever_con_cola_av.jsx';
import Server_sin_cola_av from './views/Server_sin_cola_av.jsx';
import Server_con_cola_varios from './views/Server_con_cola_varios.jsx';
import Server_sin_cola_varios from './views/Sever_sin_cola_varios.jsx';
import Server_con_cola_varios_av from './views/Server_con_cola_varios_av.jsx';
import Server_sin_cola_varios_av from './views/Sever_sin_cola_varios_av.jsx';
import MonteCarlo from './views/MonteCarlo/MonteCarlo.jsx';
import MonteCarlo_Av from './views/MonteCarlo/MonteCarlo_Av.jsx';




const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "manual", 
        element: <Manual />,
        children: [
          {
            path: "serversincolavarios", 
            element: <Server_sin_cola_varios />,
          },
          {
            path: "serverconcolavarios", 
            element: <Server_con_cola_varios />,
          }, 
          {
            path: "serversincola", 
            element: <Server_sin_cola />,
          },
          {
            path: "serverconcola", 
            element: <Server_con_cola />,
          }
          ,
          {
            path: "montecarlo", 
            element: <MonteCarlo />,
          }
        ],
      },
      {
        path: "asistentevirtual",
        element: <AsistenteVirtual />,
        children: [ 
          {
            path: "serversincolavarios", 
            element: <Server_sin_cola_varios_av />,
          },
          {
            path: "serverconcolavarios", 
            element: <Server_con_cola_varios_av />,
          }, 
          {
            path: "serversincola", 
            element: <Server_sin_cola_av />,
          },
          {
            path: "serverconcola", 
            element: <Server_con_cola_av />,
          }
          ,
          {
            path: "montecarlo", 
            element: <MonteCarlo_Av />,
          }
        ],
      }
    ],

  },
  
]);


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
