 
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 
import MetaMask from "./services/MetaMask"; 
import { create } from 'ipfs-http-client'
import axios from 'axios';
import React, { useEffect, useState } from 'react';
const projectId = process.env.REACT_APP_PROJECT_ID;
const projectSecret = process.env.REACT_APP_SECRET_KEY;
const urlIPFS = process.env.REACT_APP_URL_IPFS

axios.defaults.baseURL = process.env.API_URL ?? 'http://localhost:8000/api/v1';

const auth = "Basic " + btoa(projectId + ":" + projectSecret);
// dedicated gateway
const client = create({
    host: process.env.REACT_APP_UPLOAD_URL,
    port: 5001,
    protocol: "https",
    headers: {
        authorization: auth,
    },
});
function App() {
  const [fileUrl, setFileUrl ]= useState(null)
  const [url, setUrl ]= useState(null)
  const [hash, setHash ]= useState(null)
  const [account, setAccount] = useState(null)
  const [nric, setNric] = useState('');
  const [formInput, updateFormInput] = useState({
    price:'',
    name:'',
    description:''
  })
  async function onFileChange(e) {
    const file = e.target.files[0]
    try {
       await client
      .add(file, {
          progress: (size) => {
             
              console.log(`received: ${size}`);
          },
      })
      .then(async (response) => {
          const { path } = response;

          const url = urlIPFS+path
          setFileUrl(url)
          console.log(46, url)
        
      })
       
    } catch (error) {
      console.log(error)
    }
  }

const postData = async () => {
    try {
      const response = await axios.post('/users', {
        NRIC: nric,
        wallet_address: account
      });
      setHash(response.data)
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleNricChange = (e) => {
    console.log(73, e.target.value)
    setNric(e.target.value);
  };

  const handleNricBlur = () => {
    console.log(77, nric)
    if (nric) {
      postData();
    }
  };
  useEffect(() => {
    (async () => {
      try {
        const metaMaskInstance = new MetaMask();
        const result = await metaMaskInstance.initialize();
        console.log('initialize MetaMask Class', result);
        setAccount(result.currentAddress)
      } catch (error) {
        console.log('Error', error);
      }
    })();
  }, []);
 

  const handleMintNFT = async (e) => {
    createUrl(e)
  }
  async function createUrl(e) {
  // const handleMintNFT = async (e) => {
    console.log(68)
    e.preventDefault();
    const {name, description, nric} = formInput
    console.log(72, account, name, description, nric)
    if(!name || !description|| !fileUrl || !nric) return 
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    console.log(84, data, typeof data)
    const jsonObject = JSON.parse(data);
    console.log(75, jsonObject, typeof jsonObject);
    try {
      const added = await client.add(JSON.stringify(jsonObject));        
          console.log(97, added);
          const urlMetadata = urlIPFS+added.path;       
          console.log(89, urlMetadata);  
          setUrl(urlMetadata)
    } catch (error) {
        console.error(error);
    }
    console.log("Minting NFT...");
  };

  return (
    <div className="App">
      <header className="App-header">
        
       <form onSubmit={handleMintNFT}>
          <div className="mb-3">
            <input className="form-control" type="file" onChange={e=>onFileChange(e)}/>
          </div>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name:</label>
            <input type="text" 
            
              className="form-control" id="name" name="name" 
              onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description:</label>
            <textarea className="form-control" id="description" name="description" 
              onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
              // onChange={e=>onNRICChange(e)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="nric" className="form-label">NRIC:</label>
            <input type="text" className="form-control"
             id="nric" name="nric"  value={nric}
               onChange={handleNricChange}
               onBlur={handleNricBlur}
               placeholder="Enter NRIC"
            />
          </div>      

          <button type='submit' className="btn btn-success">
            Mint NFT
          </button>
      </form>
      </header>
    </div>
  );
}

export default App;
