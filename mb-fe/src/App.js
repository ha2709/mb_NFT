 
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 
import MetaMask from "./services/MetaMask"; 
import { create } from 'ipfs-http-client'
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import MBNFT from './utils/contracts/MBNFT.json'
import { ethers } from 'ethers';

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
  // const [url, setUrl ]= useState(null)
  const [description, setDescription ]= useState(null)
  const [name, setName] = useState(null)
  const [hash, setHash ]= useState(null)
  const [account, setAccount] = useState(null)
  const [nric, setNric] = useState('');
  // const [tokenContract, setTokenContract] = useState(null)
  // const [signer, setSigner] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        
        // setSigner(signer)
        const metaMaskInstance = new MetaMask();
        const result = await metaMaskInstance.initialize();
        console.log('initialize MetaMask Class', result);
        // setTokenContract(result.contracts.token)
        setAccount(result.currentAddress)
      } catch (error) {
        console.log('Error', error);
      }
    })();
  }, []);

  async function onFileChange(e) {
    const file = e.target.files[0]
    try {
      const response =  await client
      .add(file, {
          progress: (size) => {             
              console.log(`received: ${size}`);
          },
      })
           const { path } = response;
          const url = urlIPFS+path
          setFileUrl(url)
          console.log(46, url, fileUrl)

    } catch (error) {
      console.log(error)
    }
  }
  // useEffect(() => {
  //   console.log('File URL:', fileUrl); // This will reflect the updated value of fileUrl
  // }, [fileUrl]);
  
const postData = async () => {
    try {
      const response = await axios.post('/users', {
        NRIC: nric,
        wallet_address: account
      });
      setHash(response.data)
      console.log('Hash data :', response.data);
    } catch (error) {
      console.error('Error to create Hash :', error);
    }
  };

  const handleNricChange = (e) => {
    console.log(73, e.target.value)
    setNric(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    console.log(73, "Description ",e.target.value)
    setDescription(e.target.value);
  };
  const handleNameChange = (e) => {
    console.log(85,name, e.target.value)
    setName(e.target.value);
  };
  const handleNricBlur = () => {
    console.log(77, nric)
    if (nric) {
      postData();
    }
  };


  const createUrl = async (e) =>{
    e.preventDefault();
    try {
    console.log(112, account, name, description, fileUrl)
    // if(!name || !description|| !fileUrl || !nric) return 
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    // console.log(84, data, typeof data)
    const jsonObject = JSON.parse(data);
    // console.log(75, jsonObject, typeof jsonObject);

      const added = await client.add(JSON.stringify(jsonObject));        
          // console.log(97, added);
          const urlMetadata = urlIPFS+added.path;   
          // setUrl(urlMetadata)    
          console.log(125, urlMetadata ); 
          await handleMintNFT(urlMetadata) 
          
    } catch (error) {
        console.error(error);
    }
   
  };
  
  const handleMintNFT = async (url) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      const signer = provider.getSigner();
      console.log(139, signer)
      const tokenContract = new ethers.Contract('0x3E481449dCd35ABC492Fcd2aC17ef100c5399949', MBNFT.abi, signer);
      console.log(140, tokenContract)
     
      console.log("Minting NFT...", account, url, hash["hash"]);
    
      // console.log(148, account,url,   hash["hash"], typeof url,  typeof hash['hash'])
      try {
        let transaction = await tokenContract.mintNFT(account, url, hash)
        console.log(147, transaction)
      } catch (error) {
        console.log(error)
      }
  
    
  }
  return (
    <div className="App">
      <header className="App-header">
        
       <form onSubmit={createUrl}>
     
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name:</label>
            <input type="text" 
            
              className="form-control" id="name" name="name" 
              onChange={handleNameChange}
              // onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description:</label>
            <textarea className="form-control" id="description" name="description" 
              // onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
              onChange={handleDescriptionChange}
             
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
          <div className="mb-3">
            <input className="form-control" type="file" onChange={e=>onFileChange(e)}/>
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
