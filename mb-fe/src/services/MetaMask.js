import { ethers } from 'ethers';
import Swal from 'sweetalert2';
import MBNFT from '../utils/contracts/MBNFT.json'
// '/utils/contracts/Token1155.json';
class MetaMask {
    instance;
    provider;
    signer;
    contracts = { token: {} };
    addresses = {  token: '' };
    network;
    balance;

    constructor() {
      this.instance = MetaMask.instance();
    }

    static isInstalled() {
      return window && typeof window.ethereum !== 'undefined';
    }

    static instance() {
      if (this.isInstalled()) {
        return window.ethereum;
      }
      Swal.fire({
        title: 'Oops!',
        html: `Please install <strong>MetaMask</strong> extension to use this feature.`,
        confirmButtonText: 'Install',
        icon: 'error'
      }).then((answer) => {
        if (answer.value) {
          window.location.href = process.env.METAMASK_CHROME_LINK ?? 'https://metamask.io';
        }
      });
      throw new Error('Please install MetaMask extension to use this feature.');
    }

    static target() {
      return typeof window.MetaMaskTarget !== 'undefined'
        ? window.MetaMaskTarget
        : (window.MetaMaskTarget = new EventTarget());
    }

    async initialize() {
      if (!MetaMask.isInstalled()) {
          throw new Error('Metamask is not yet installed.');
      }

      try {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
    
        this.signer = this.provider.getSigner();
    
      } catch (error) {
          throw new Error(error);
      }

      return new Promise((resolve, reject) => {
      
        this.network = this.provider.getNetwork().then(async (response) => {
        const { chainId } = response;

   
           
        this.getAddresses(chainId);
        this.getContracts();
       
          resolve({
              currentAddress: MetaMask.instance().selectedAddress,
              signer: this.signer,
              addresses: this.getAddresses(chainId),
              contracts: await this.getContracts(),
              mintNFT: this.mintNFT,
              fetchOwnedItems: this.fetchOwnedItems()
          });
      });
    });
    }

    async getContracts() {
      const tokenContract = new ethers.Contract(this.addresses.token, MBNFT.abi, this.signer);
      this.contract = {
        token: tokenContract         
      };
   
       return this.contract
    };

    getAddresses(chainId) {
      if (chainId === 1) {
        this.addresses = {
          token: process.env.TOKEN_ADDRESS || '',
          
        };
      } else {
        try {
          // Throw an error if the contract has not been deployed to other networks
          const tokenAddress =
            MBNFT.networks[chainId] && MBNFT.networks[chainId].address
              ? MBNFT.networks[chainId].address
              : '';
          this.addresses = {
            token: tokenAddress,
           
          };
        } catch (error) {
          console.log('not deployed contract to this network', error);
        }
      }
  
      return this.addresses;
    };

    mintNFT = async (to, tokenURI, hash) => {
      console.log(115, to, tokenURI, hash)
      return new Promise(async (resolve, reject) => {
          const tokenContract = this.contracts.token;
          let transaction = await tokenContract.mintNFT(to, tokenURI, hash)
          let receipt = await transaction.wait()
          let event = receipt.events[0]
          let value = event.args[2]
          let tokenId = value.toNumber()
          console.log(receipt)
          resolve(receipt);
        })
      }
    
      fetchOwnedItems = async () => {
         
        return new Promise(async (resolve, reject) => {
          console.log(132, this.contracts?.token)
            const tokenContract = this.contracts.token;
            console.log(134, tokenContract)
            // let tokenId = await tokenContract.tokenIds()
            resolve(tokenContract)
            console.log(133, tokenContract)
            // let tokenId = await tokenContract.name()
            // console.log(tokenId)
            
          })
        }

}

export default MetaMask;
