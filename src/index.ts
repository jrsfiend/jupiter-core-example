import { AddressLookupTableAccount, CompileV0Args, Connection, Message, MessageV0, PublicKey, Transaction, TransactionMessage, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import fetch from "node-fetch";
import JSBI from "jsbi";
import {
  getPlatformFeeAccounts,
  Jupiter,
  RouteInfo,
  TOKEN_LIST_URL,
} from "@jup-ag/core";
import fs from 'fs';
 // @ts-ignore
import { SolendMarket, flashBorrowReserveLiquidityInstruction, SOLEND_PRODUCTION_PROGRAM_ID, flashRepayReserveLiquidityInstruction, SolendReserve } from "@solendprotocol/solend-sdk";
import Decimal from "decimal.js";
import {
  ENV,
  INPUT_MINT_ADDRESS,
  OUTPUT_MINT_ADDRESS,
  SOLANA_RPC_ENDPOINT,
  Token,
  USER_KEYPAIR,
} from "./constants";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// @ts-ignore
import { createTransferInstruction } from "../spl-token";

const getPossiblePairsTokenInfo = ({
  tokens,
  routeMap,
  inputToken,
}: {
  tokens: Token[];
  routeMap: Map<string, string[]>;
  inputToken?: Token;
}) => {
  try {
    if (!inputToken) {
      return {};
    }

    const possiblePairs = inputToken
      ? routeMap.get(inputToken.address) || []
      : []; // return an array of token mints that can be swapped with SOL
    const possiblePairsTokenInfo: { [key: string]: Token | undefined } = {};
    possiblePairs.forEach((address) => {
      possiblePairsTokenInfo[address] = tokens.find((t) => {
        return t.address == address;
      });
    });
    // Perform your conditionals here to use other outputToken
    // const alternativeOutputToken = possiblePairsTokenInfo[USDT_MINT_ADDRESS]
    return possiblePairsTokenInfo;
  } catch (error) {
    throw error;
  }
};

const getRoutes = async ({
  inputToken,
  outputToken,
  inputAmount,
  slippageBps,
}: {
  inputToken?: Token;
  outputToken?: Token;
  inputAmount: number;
  slippageBps: number;
}) => {
  try {
    if (!inputToken || !outputToken) {
      return null;
    }

    console.log(
      `Getting routes for ${inputAmount} ${inputToken.symbol} -> ${outputToken.symbol}...`
    );
    const inputAmountInSmallestUnits = inputToken
      ? Math.round(inputAmount * 10 ** inputToken.decimals)
      : 0;

    const routes =  await fetch(
          "http://127.0.0.1:8080/quote?inputMint="+inputToken.address+"&outputMint="+outputToken.address+"&amount="+inputAmountInSmallestUnits.toString()+"&slippageBps="+slippageBps.toString()
        ).then((res) => res.json()) 

    if (routes && routes.routePlan) {
      console.log("Possible number of routes:", routes.routePlan.length);
      console.log(
        "Best quote: ",
        new Decimal(routes.routePlan[0].swapInfo.outAmount.toString())
          .div(10 ** outputToken.decimals)
          .toString(),
        `(${outputToken.symbol})`
      );
      return routes;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

const executeSwap = async ({
  connection,
  routeInfo,
  routeInfo2
}: {
  connection: Connection;
  routeInfo: any;
  routeInfo2: any;
}) => {
  try {
    // get serialized transactions for the swap
  var { swapTransaction } = await (
    await fetch('http://127.0.0.1:8080/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // quoteResponse from /quote api
        quoteResponse: routeInfo,
        // user public key to be used for the swap
        userPublicKey: USER_KEYPAIR.publicKey.toString(),
        // auto wrap and unwrap SOL. default is true
        
			restrictIntermediateTokens: true,
			wrapUnwrapSOL: false,
        // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
        // feeAccount: "fee_account_public_key"
      })
    })
  ).json();
  // deserialize the transaction
var swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
var messagev0 = VersionedTransaction.deserialize(swapTransactionBuf)
let addressLookupTables = []
addressLookupTables.push(...messagev0.message.addressTableLookups)
let luts2 = []
let luts = []
  let ls = ["BYCAUgBHwZaVXZsbH7ePZro9YVFKChLE8Q6z4bUvkF1f",
  "5taqdZKrVg4UM2wT6p2DGVY1uFnsV6fce3auQvcxMCya",
  "2V7kVs1TsZv7j38UTv4Dgbc6h258KS8eo5GZL9yhxCjv",
  "9kfsqRaTP2Zs6jXxtVa1ySiwVYviKxvrDXNavxDxsfNC",
  "2gDBWtTf2Mc9AvqxZiActcDxASaVqBdirtM3BgCZduLi"]
  for (var l of ls){
    luts.push((await connection.getAddressLookupTable(new PublicKey(l))).value as AddressLookupTableAccount)
  }
      for (var lut of addressLookupTables){
        luts2.push((await connection.getAddressLookupTable(lut.accountKey)).value as AddressLookupTableAccount)
        luts.push((await connection.getAddressLookupTable(lut.accountKey)).value as AddressLookupTableAccount)
      }
  var message = TransactionMessage.decompile(messagev0.message, {
    addressLookupTableAccounts: luts2
  });

  let thepaydirt = []
  thepaydirt.push(...message.instructions)

    var { swapTransaction } = await (
      await fetch('http://127.0.0.1:8080/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // quoteResponse from /quote api
          quoteResponse: routeInfo2,
          // user public key to be used for the swap
          userPublicKey: USER_KEYPAIR.publicKey.toString(),
          // auto wrap and unwrap SOL. default is true
          
			restrictIntermediateTokens: true,
        wrapUnwrapSOL: false,
          // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          // feeAccount: "fee_account_public_key"
        })
      })
    ).json();
    
 
  var swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
  var messagev0 = VersionedTransaction.deserialize(swapTransactionBuf)
  
    // @ts-ignore

     luts2 = []
        for (var lut of messagev0.message.addressTableLookups){
          luts2.push((await connection.getAddressLookupTable(lut.accountKey)).value as AddressLookupTableAccount)
          luts.push((await connection.getAddressLookupTable(lut.accountKey)).value as AddressLookupTableAccount)
        }
    var message = TransactionMessage.decompile(messagev0.message, {
      addressLookupTableAccounts: luts2
    });
  
    thepaydirt.push(...message.instructions)
    var lastix = thepaydirt[thepaydirt.length-1]
  thepaydirt = thepaydirt.splice(0,thepaydirt.length-2)
  thepaydirt.push(lastix)

    // @ts-ignore
    let me = (await connection.getParsedTokenAccountsByOwner(USER_KEYPAIR.publicKey, {
      mint: new PublicKey(routeInfo.inputMint)
    }))
    let tokenAccount= me.value[0].pubkey;
    let configs = JSON.parse(
			fs
				.readFileSync(
				 "./configs.json").toString()
		);
		//		configs = configs.filter((c) => ((!c.isHidden && c.isPermissionless ) || c.isPrimary))

		configs = configs.filter(
			(c: any) => !c.isHidden && !c.isPermissionless && c.reserves.length > 4 && c.reserves.filter((r: any) => r.liquidityToken.mint == routeInfo.inputMint).length > 0
		);

		let config = configs[Math.floor(Math.random() * configs.length)];
		let market = await SolendMarket.initialize(
      // @ts-ignore
			connection,
			"production", // optional environment argument
			/*process.env.tradingStrategy == "pingpong"
				? process.env.marketKey
				: */ (config.address) // optional m address (TURBO SOL). Defaults to 'Main' market
		);

		// 2. Read on-chain accounts for reserve data and cache
		await market.loadReserves();
		market.refreshAll();
    let reserve = market.reserves.find((r) => r.config.liquidityToken.mint == routeInfo.inputMint) as SolendReserve;
     let tinsts = [];
      let instructions = [
        //...tinsts,
        flashBorrowReserveLiquidityInstruction(
          new BN(routeInfo.routePlan[0].swapInfo.inAmount),
          new PublicKey(reserve.config.liquidityAddress),
          tokenAccount,
          new PublicKey(reserve.config.address),
          new PublicKey(market.config.address),
          SOLEND_PRODUCTION_PROGRAM_ID
        ),
        ...thepaydirt,
        flashRepayReserveLiquidityInstruction(
          new BN(routeInfo.routePlan[0].swapInfo.inAmount),
          tinsts.length,
          tokenAccount,
          new PublicKey(reserve.config.liquidityAddress),
          new PublicKey(reserve.config.liquidityFeeReceiverAddress),
          tokenAccount,
          new PublicKey(reserve.config.address),
          new PublicKey(market.config.address),
          USER_KEYPAIR.publicKey,
          SOLEND_PRODUCTION_PROGRAM_ID
        ),createTransferInstruction(
          
          /*

      programId: PublicKey,
      source: PublicKey,
      destination: PublicKey,
      owner: PublicKey,
      multiSigners: Array<Signer>,
      amount: number | u64,*/
           tokenAccount,
          tokenAccount, USER_KEYPAIR.publicKey,(Number(
            (				await connection.getTokenAccountBalance(tokenAccount)).value.amount + 0.000005 * 10 ** 9)),
          [], )
         /*, 
        jaregm,
        USER_KEYPAIR)*/
      ];
      instructions[instructions.length-1].programId = TOKEN_PROGRAM_ID
      //	console.log(execute.transactions.swapTransaction.instructions.length)
  
      //	execute.transactions.swapTransaction.instructions = instructions
      //	console.log(execute.transactions.swapTransaction.instructions.length)
   
      console.log("luts: " + (addressLookupTables.length ).toString());
      console.log(reserve.config.liquidityToken.mint);
      
      //console.log(...instructions)
      const messageV00 = new TransactionMessage({
        payerKey: USER_KEYPAIR.publicKey,
        recentBlockhash: await (await connection.getLatestBlockhash()).blockhash,
        instructions: instructions,
      }).compileToV0Message(luts);
      const transaction = new VersionedTransaction(messageV00);
      if (tinsts.length > 0) {
        //	transaction.sign(signers)
      }
      // @ts-ignore
      transaction.sign([USER_KEYPAIR]);

      
      try {
        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: false,
          maxRetries: 2
        });
        console.log(`https://solscan.io/tx/${txid}`);
        
        
      } catch (err) {
        console.log(err);
      }
  

  } catch (error) {
    throw error;
  }
};

const main = async () => {
  try {
    const connection = new Connection(SOLANA_RPC_ENDPOINT); // Setup Solana RPC connection
    const tokens: Token[] = await (await fetch(TOKEN_LIST_URL[ENV])).json(); // Fetch token list from Jupiter API

    // If you want to add platformFee as integrator: https://docs.jup.ag/jupiter-core/adding-platform-fees
   
    // If you know which input/output pair you want
    const inputToken = tokens.find((t) => t.address == INPUT_MINT_ADDRESS); // USDC Mint Info
    const outputToken = tokens.find((t) => t.address == OUTPUT_MINT_ADDRESS); // USDT Mint Info
    while (true){
    const routes = await getRoutes({
      inputToken,
      outputToken,
      inputAmount: 1, // 1 unit in UI
      slippageBps: 100, // 1% slippage
    });


    const routes2 = await getRoutes({
      outputToken: inputToken,
      inputToken: outputToken,
      inputAmount: routes!.routePlan[0].swapInfo.outAmount / 10 ** outputToken!.decimals, // 1 unit in UI
      slippageBps: 100, // 1% slippage
    });
    // Routes are sorted based on outputAmount, so ideally the first route is the best.
    await executeSwap({ connection, routeInfo: routes!, routeInfo2: routes2! });
  }
  } catch (error) {
    console.log({ error });
  }
};

main();
