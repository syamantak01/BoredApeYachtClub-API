import {
    Token as TokenContract, //to talk to the token contract
    Transfer as TransferEvent //To get the proper types to interact with the contract
} from "../generated/Token/Token"

//importing APIs to talk to the graph node
import {
    Token, User
} from '../generated/schema'


import { ipfs, json, JSONValue } from '@graphprotocol/graph-ts'

let ipfsHash = "QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq"

//handleTransfer is the actual resolver that is going to be executed when the transfer event is emitted
export function handleTransfer(event: TransferEvent): void {

    //load some token id from the event parameters
    let token = Token.load(event.params.tokenId.toString());

    //if token doesnt exist, meaning the first time the token is created
    if (!token) {
        //Create the token
        token = new Token(event.params.tokenId.toString());
        token.tokenID = event.params.tokenId;

        var blockTimestamp = new Date(event.block.timestamp.toI64() * 1000);
        token.createdAtTimestamp = blockTimestamp.toString();

        token.tokenURI = "/" + event.params.tokenId.toString()

        let metadata = ipfs.cat(ipfsHash + token.tokenURI);

        if (metadata) {
            const value = json.fromBytes(metadata).toObject();
            if (value) {
                const image = value.get('image');
                if (image) {
                    let image_hash = image.toString().split("ipfs://")[1]
                    token.image = "ipfs.io/ipfs/" + image_hash
                }
            }

            //next we get the attributes which will have trait_type and value and we get thsese properties and assign them
            let attributes: JSONValue[];
            let atts = value.get('attributes');
            if (atts) {
                attributes = atts.toArray();


                for (let i = 0; i < attributes.length; i++) {
                    let item = attributes[i].toObject();
                    let trait: string;
                    let t = item.get('trait_type');

                    if (t) {
                        trait = t.toString();

                        let value: string
                        let v = item.get('value');
                        if (v) {
                            value = v.toString()
                            if (trait == "Mouth") {
                                token.mouth = value;
                            }

                            if (trait == "Eyes") {
                                token.eyes = value;
                            }

                            if (trait == "Background") {
                                token.background = value;
                            }

                            if (trait == "Hat") {
                                token.hat = value;
                            }

                            if (trait == "Clothes") {
                                token.clothes = value;
                            }

                            if (trait == "Fur") {
                                token.fur = value;
                            }

                            if (trait == "Earring") {
                                token.earring = value;
                            }
                        }
                    }
                }
            }
        }
    }


    token.owner = event.params.to.toHexString();
    token.save();

    let user = User.load(event.params.to.toHexString());
    if (!user) {
        user = new User(event.params.to.toHexString());
        user.save();
    }
}

