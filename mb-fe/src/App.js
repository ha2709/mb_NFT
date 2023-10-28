import React  from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import MBNFT from './utils/contracts/MBNFT.json';
import { create } from 'ipfs-http-client';
import axios from 'axios';
const projectId = "2XNVAJS1rIPhlCaRGDSAj6UKR7U";
const projectSecret = "860cfdaac879f7aa6145d03e4639c3a8";
// const projectId = process.env.REACT_APP_projectId;
// const projectSecret = process.env.REACT_APP_SECRET_KEY;
const UPLOAD_URL = process.env.REACT_APP_URL_IPFS;
// console.log(12, UPLOAD_URL)
const API_URL = process.env.API_URL || 'http://localhost:8000/api/v1';

axios.defaults.baseURL = API_URL;
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
// const auth = "Basic " + btoa(projectId + ":" + projectSecret);
const host= process.env.REACT_APP_UPLOAD_URL
const port= 5001
const client = create({
  
  host:"ipfs.io/ipfs",
  port: 5001,
  // host,
  // port, 
  protocol: "https",
  headers: {
  authorization: auth,
  
},
});

function App() {
  const [fileUrl, setFileUrl] = useState(null);
  const [metadataUrl, setMetaDataUrl] = useState("");
  const [description, setDescription] = useState(null);
  const [name, setName] = useState(null);
  const [hash, setHash] = useState(null);
  const [account, setAccount] = useState(null);
  const [nric, setNric] = useState('');
  const [tokenContract, setTokenContract] = useState(null);

  useEffect(() => {
    (async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          let network = await provider.getNetwork();
          let chainId = network.chainId;
          let tokenAddress = MBNFT.networks[chainId].address;

          const contract = new ethers.Contract(tokenAddress, MBNFT.abi, signer);
          setTokenContract(contract);
          getImageUrl(contract, signer)
    
        } catch (error) {
          console.log('Error', error);
        }
      } else {
        throw new Error("MetaMask is not installed or not enabled");
      }
    })();
  }, []);

  async function getImageUrl(contract, signer) {
    let tokenId = await contract._tokenIds();
    const currentAccount = await signer.getAddress();

    setAccount(currentAccount);
    tokenId = parseInt(tokenId.toString());

    let metadataUrl;
    for (let i = 1; i <= tokenId; i++) {
      let owner = await contract.ownerOf(i);
      if (owner.toLowerCase() === currentAccount.toLowerCase()) {
        metadataUrl = await contract.tokenURI(i);
        break;
      }
    }

    if (metadataUrl != null) {
      try {
        // bug in here, I can't replace with variable from .env 
        // let newString = metadataUrl.replace(process.env.REACT_APP_URL_INFURA, process.env.REACT_APP_URL_HENRY);
        // console.log(89, process.env.REACT_APP_URL_IPFS, metadataUrl)
        let newString = metadataUrl.replace("https://infura-ipfs.io", "https://henry.infura-ipfs.io");
        // console.log(91, newString)
        let metadata = await axios.get(newString, "");
        console.log(metadata)
        setMetaDataUrl(metadata.data.image);
      } catch (error) {
        console.error("No NFT", error);
      }
    }
  }
  async function onFileChange(e) {
    const file = e.target.files[0];
    try {
      const response = await client.add(file, {
        progress: (size) => {
          console.log(`received: ${size}`);
        },
      });
      const { path } = response;
      console.log(96, response)
    
      const url =   `https://ipfs.io/ipfs/${path} `;
      console.log(95, url)
      setFileUrl(url);
    } catch (error) {
      console.log(error);
    }
  }

  const postData = async () => {
    try {
      const response = await axios.post('/users', {
        NRIC: nric,
        wallet_address: account,
      });
      let data = response.data
      setHash(data);
      console.log(127, data)
    } catch (error) {
      console.error('Error to create Hash:', error);
    }
  };

  const handleNricChange = (e) => {
    setNric(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleNricBlur = () => {
    if (nric) {
      postData();
    }
  };

  const createUrl = async (e) => {
    e.preventDefault();
    try {
      const data = JSON.stringify({
        name,
        description,
        image: fileUrl,
      });

      const jsonObject = JSON.parse(data);
      const added = await client.add(JSON.stringify(jsonObject));
      const urlMetadata = UPLOAD_URL + added.path;

      await handleMintNFT(urlMetadata);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMintNFT = async (url) => {
    try {
      let transaction = await tokenContract.mintNFT(account, url, hash.hash);
      let confirmation = await transaction.wait();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={createUrl}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name:
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              onChange={handleNameChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description:
            </label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              onChange={handleDescriptionChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="nric" className="form-label">
              NRIC:
            </label>
            <input
              type="text"
              className="form-control"
              id="nric"
              name="nric"
              value={nric}
              onChange={handleNricChange}
              onBlur={handleNricBlur}
              placeholder="Enter NRIC"
            />
          </div>
          <div className="mb-3">
            <input className="form-control" type="file" onChange={(e) => onFileChange(e)} />
          </div>
          <button type="submit" className="btn btn-success">
            Mint NFT
          </button>
        </form>
        {metadataUrl && <img className="rounded mt-4" width="350" src={metadataUrl} />}
      </header>
    </div>
  );
}

export default App;
