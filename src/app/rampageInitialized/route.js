import { NextResponse } from "next/server";
import { ethers } from "ethers";
import NFTABI from '../../constants/NFT.json';
import POINTABI from '../../constants/POINTCORE.json' ;

const burnerkey = '5529515032d858020960de5d374887e1bfe73d938e5a0ecdb43ae038f6631ecf'
const provider = new ethers.providers.JsonRpcProvider(`https://rpc.gobob.xyz/`)
const wallet = new ethers.Wallet(burnerkey,provider);
const sobAddress = "0x3eFC90a28685d320F6916b76D8C679da67cc23DC";
const pointCore = "0xCA9c5943Dd7d0fE1E6A0Cf12F2eA65d310A3b2AA";

const sobCa = new ethers.Contract(sobAddress,NFTABI.abi,wallet);
const pointCa = new ethers.Contract(pointCore, POINTABI.abi, wallet);

export async function POST(req , res) {
    const {address} = await req.json();
    console.log(address);
    try {
        const isValidFormat = isValidBytes20Address(address);
        if(!isValidFormat){
            return NextResponse.json(
                {
                    error:{code:500, message:"WRONG ADDRESS FORMAT"}, 
                    data:null
                }
            )
        }else{
            const respo =await accountInitialized(address);
            return NextResponse.json(
                {
                    error:{code:200, message:"OK"}, 
                    data:{
                        result:respo? respo:false
                    }
                }
            )
        }
    } catch (error) {
        return NextResponse.json(
            {
                error:{code:500, message:"ERROR"}, 
                data:null
            }
        )
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