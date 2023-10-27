import { ethers } from 'ethers';
import Swal from 'sweetalert2';

class MetaMask {
    instance;
    provider;
    signer;

    addresses = { market: '', token: '' };
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
        const { chainId } = await this.provider.getNetwork();
        this.network = chainId;
        // let accounts = await this.provider.send('eth_requestAccounts', []);
     
        this.signer = this.provider.getSigner();
      } catch (error) {
          throw new Error(error);
      }

      return new Promise((resolve, reject) => {
          resolve({
              currentAddress: MetaMask.instance().selectedAddress,
              signer: this.signer,
          });
      });
    }
}

export default MetaMask;
