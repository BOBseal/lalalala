import express from 'express'
import { urlencoded } from 'express';
import { ethers } from 'ethers';
import { rateLimit } from 'express-rate-limit';
// Import JSON files with assertion
import NFTABI from './constants/NFT.json' assert { type: 'json' };
import POINTABI from './constants/POINTCORE.json' assert { type: 'json' };

const app = express();
const port = 3000;

const burnerkey = '5529515032d858020960de5d374887e1bfe73d938e5a0ecdb43ae038f6631ecf'
const provider = new ethers.providers.JsonRpcProvider(`https://rpc.gobob.xyz/`)
const wallet = new ethers.Wallet(burnerkey,provider);
const sobAddress = "0x3eFC90a28685d320F6916b76D8C679da67cc23DC";
const pointCore = "0xCA9c5943Dd7d0fE1E6A0Cf12F2eA65d310A3b2AA";

const sobCa = new ethers.Contract(sobAddress,NFTABI.abi,wallet);
const pointCa = new ethers.Contract(pointCore, POINTABI.abi, wallet);
// Middleware to parse JSON bodies
app.use(express.json());
app.use(urlencoded({extended:true}))

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
  message: {
    "error": {
      "code": 429,
      "message": "Too many requests, please try again later."
    },
    "data": null
  }
});

app.use(limiter);

// Define the POST route
app.post('/sobHolder', async(req, res) => {
  console.log(req.body);
  const {address} = req.body;
  console.log(address);
  const isValidFormat = isValidBytes20Address(address);
  if (!isValidFormat) {
    const response = {
      "error": {
        "code": 400,
        "message": "Invalid address format. Address must be in bytes20 format."
      },
      "data": null
    };
    return res.status(400).json(response);
  }
  
  // Your logic to determine true/false based on the address
  const isValid =await validateAddress(address);
  const response = {
    "error": {
        "code": !isValid ? 400 : 200,
        "message": !isValid ? "Invalid request" : "OK"
    },
    "data": {
        "result": isValid ? isValid : false
    }
  };
  // Send the response
  res.json(response);
});

app.post('/rampageInitialized',async(req,res)=>{
  console.log(req.body);
  const address = req.body.address;
  console.log(address)
  const isValidFormat = isValidBytes20Address(address);
  if (!isValidFormat) {
    const response = {
      "error": {
        "code": 400,
        "message": "Invalid address format. Address must be in bytes20 format with correct checksum."
      },
      "data": null
    };
    return res.status(400).json(response);
  }
  const isValid = await accountInitialized(address);

  const response = {
    "error": {
        "code": isValid === "error" ? 400 : 200,
        "message": isValid === "error" ? "Invalid request" : "OK"
    },
    "data": {
        "result": isValid ? isValid : false
    }
  };
  res.json(response);
})

// Function to validate address (replace with your actual validation logic)
async function validateAddress(address) {
  if (!address) {
    return;
  }
  if(address){
    try {
      const cc = await sobCa.balanceOf(address);
      if(cc && cc > 0){
        return true;
      }
    } catch (error) {
      console.error("Error validating address:", error.message);
      return false;
    }
  }
}

async function accountInitialized(address){
  if (!address) {
    return;
  }
  if(address){
    try {
      const dataArray = await pointCa.getUser(address);
      if(dataArray){
        return dataArray[4]
      }
    } catch (error) {
      console.error("Error validating address:", error.message);
      return "error";
    }
  }
}

function isValidBytes20Address(address) {
  const bytes20Regex = /^0x[0-9a-fA-F]{40}$/;
  return bytes20Regex.test(address);
}

app.listen(port,'0.0.0.0',() => {
  console.log(`Server is running on port ${port}`);
});