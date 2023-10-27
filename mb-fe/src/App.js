 
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; 
import MetaMask from "./services/MetaMask"; 
import { create } from 'ipfs-http-client'
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import MBNFT from './utils/contracts/MBNFT.json'
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
  const [fileUrl, setFileUrl ] = useState(null)
  const [metadataUrl, setMetaDataUrl] = useState("")
  const [description, setDescription ]= useState(null)
  const [name, setName] = useState(null)
  const [hash, setHash ]= useState(null)
  const [account, setAccount] = useState(null)
  const [nric, setNric] = useState('');
  const [tokenContract, setTokenContract] = useState(null)
 

  useEffect(() => {
    (async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log(41, provider)
        const signer =  provider.getSigner();
        console.log(signer)
        let network = await provider.getNetwork()
        console.log(44, network)
        let chainId
        chainId =  network['chainId']
        console.log(45, chainId)
        let tokenAddress = MBNFT.networks[chainId].address
        console.log(50, tokenAddress)
        const tokenContract = new ethers.Contract(tokenAddress,
                                                    MBNFT.abi,
                                                      signer);
        const metaMaskInstance = new MetaMask();
        const result = await metaMaskInstance.initialize();
        console.log('initialize MetaMask Class', result);
        // let tokenContract = await result.contracts.token
  
        let tokenId = await tokenContract._tokenIds()
        let account = result.currentAddress
        setAccount(account)
        tokenId = parseInt(tokenId.toString())
        console.log(63, tokenId)
        let metadataUrl
        for (let i = 1; i <= tokenId; i++) {
          console.log(typeof i, i )
          let owner = await tokenContract.ownerOf(i)
          console.log(68, owner, account, owner.toLowerCase()  == account.toLowerCase())
          if (owner.toLowerCase()  == account.toLowerCase()) {
             metadataUrl = await tokenContract.tokenURI(i)
             console.log(57, metadataUrl)
             break
          }
        }
        let newString = metadataUrl.replace("https://infura-ipfs.io", "https://xctualyfe.infura-ipfs.io");

        let metadata = await axios.get(newString)
        setMetaDataUrl(metadata['data']['image'])
        console.log(metadata['data'])
        // setMetaDataUrl(metadataUrl)
        setTokenContract(tokenContract)
   
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
  
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
 
    const jsonObject = JSON.parse(data);
    const added = await client.add(JSON.stringify(jsonObject));        
    const urlMetadata = urlIPFS+added.path;   
    // console.log(125, urlMetadata ); 
    await handleMintNFT(urlMetadata) 
          
    } catch (error) {
        console.error(error);
    }
   
  };
  
  const handleMintNFT = async (url) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log(41, provider)
    const signer =  provider.getSigner();
    console.log(signer)
    let network = await provider.getNetwork()
    console.log(44, network)
    let chainId
    chainId =  network['chainId']
    console.log(45, chainId)
    let tokenAddress = MBNFT.networks[chainId].address
    console.log(50, tokenAddress)
    const tokenContract = new ethers.Contract(tokenAddress,
                                                MBNFT.abi,
                                                  signer);
    
      try {
        let transaction = await tokenContract.mintNFT(account, url, hash['hash'])
        console.log(transaction)
        console.log(160,transaction.value.toNumber() )
   
        let confirmation = await transaction.wait()
        console.log(165, confirmation)
   
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
      {
          metadataUrl && (
            <img className="rounded mt-4" width="350" src={metadataUrl} />
          )
        }
      </header>
    </div>
  );
}

export default App;
