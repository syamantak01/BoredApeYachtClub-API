# Bored Ape Yacht Club NFT API

This project involves building subgraph for querying NFT data from the [Bored-Ape-Yatch-Club](https://etherscan.io/address/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D) smart contract, implementing queries for fetching NFTs as well as their owners, building relationships between them, full text search, sorting, and filtering.

## Initialisation

### 1) Creating the Graph project with **The Graph UI**

1. Go to [The Graph Hosted Service](https://thegraph.com/hosted-service/) and either sign in with github.
>
> - To create a subgraph, we have 2 options: `Subgraph studio` and `Hosted Service`. **Hosted Service** is the centralised version of The Graph and **Subgraph Studio** deploys The Graph on a decentralised network.
> - To build an NFT API, we will use IPFS protocol which is not supported in decentralised network as of when building this project hence we will use centralised version i.e., **Hosted Service**

2. Then go to the dashboard and click on ***Add Subgraph*** to create a new subgraph. Give suitable name and subtitle to the subgraph

### 2) Initialization of a new subgraph using the **The Graph CLI**

1. Install the Graph CLI:

    ```bash
    $ npm install -g @graphprotocol/graph-cli

    # or

    $ yarn global add @graphprotocol/graph-cli
    ```

2. Once the Graph CLI has been installed you can initialize a new subgraph with the Graph CLI `init` command.

    There are two ways to initialize a new subgraph:

    1 - From an example subgraph

    ```sh
    graph init --from-example <GITHUB_USERNAME>/<SUBGRAPH_NAME> [<DIRECTORY>]
    ```

    2 - From an existing smart contract

    If you already have a smart contract deployed to Ethereum mainnet or one of the testnets, initializing a new subgraph from this contract is an easy way to get up and running.

    ```sh
    $ graph init --from-contract <CONTRACT_ADDRESS> \
    [--network <ETHEREUM_NETWORK>] \
    [--abi <FILE>] \
    <GITHUB_USER>/<SUBGRAPH_NAME> [<DIRECTORY>]
    ```

    We will use the `--from-contract` flag and pass the contract address([Bored Ape Yacht Club NFT contract](https://etherscan.io/address/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D#code)) to initialise the subgraph

    ```bash
    ❯ graph init --from-contract 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D --contract-name Token --network mainnet --index-events

    ✔ Protocol · ethereum
    ✔ Product for which to initialize · hosted-service
    ✔ Subgraph name · syamantak01/bored-ape
    ✔ Directory to create the subgraph in · bored-ape
    ✔ Ethereum network · mainnet
    ✔ Contract address · 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D
    ✔ Fetching ABI from Etherscan
    ✔ Contract Name · Token

    ———
    Generate subgraph
    Write subgraph to directory
    ✔ Create subgraph scaffold
    ✔ Initialize networks config
    ✔ Initialize subgraph repository
    ✔ Install dependencies with yarn
    ✔ Generate ABI and schema types with yarn codegen

    Subgraph syamantak01/bored-ape created in bored-ape
    ```

    This command will generate a basic subgraph based off of the contract address passed in as the argument to `--from-contract`. By using this contract address, the CLI will initialize a few things in your project to get us started (including fetching the `abis` and saving them in the **abis** directory).

    > By passing in `--index-events` the CLI will automatically index every event that is emmitted in the contract([Bored Ape Yacht Club NFT contract](https://etherscan.io/address/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D#code)) for us which will setup some code out of the box for us both in **schema.graphql** as well as **src/mapping.ts**.

## Write the Subgraph

The three main files that we will be working with are:

1. **Schema(schema.graphql**: a GraphQL schema that defines what data is stored for your subgraph, and how to query it via GraphQL
2. **Manifest(subgraph.yaml)**: The manifest defines what datasources your subgraphs will index. The subgraph.yaml file is the main subgraph configuration file which contains the definitions for the subgraph.
3. **AssemblyScript Mappings(mapping.ts)**: It transforms the incoming event data in Ethereum to the entities defined in your schema. Its going to define how the data that we're going to work with is going to be essentially saved.

### Defining the entities in schema.graphql

With The Graph, you define entity types in **schema.graphql**, and Graph Node will generate top level fields for querying single instances and collections of that entity type. Each type that should be an entity is required to be annotated with an `@entity` directive.

The entities we will be indexing are the `Token` and `User`. A `User` will have many tokens and a token is going to have one user there will be one-to-one relationship between a token and a user and a one-to-many relationship between a user and their tokens.

We make the entities searchable by using `@fulltext`search directive

To populate the entities, we'll be fetching metadata from IPFS using the token ID to get information like the image and attributes

For example, the base URI for bored ape NFT is:

```
ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq
```

To see the metadata of NFT with token ID: 100

```
https://ipfs.io/ipfs/ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/100
```

This way we can view the metadata of all the NFTs

Update **schema.graphql** with the following code:

```graphql
type Token @entity{
  id: ID!
  tokenID: BigInt!
  tokenURI: String!
  owner: User!
  image: String!
  background: String
  mouth: String
  hat: String
  fur: String
  eyes: String
  clothes: String
  earring: String
  createdAtTimestamp: BigInt!
}

type User @entity {
  id: ID!
  tokens: [Token!]! @derivedFrom(field: "owner")
}

type _Schema_
  @fulltext(
    name: "apeSearch"
    language: en
    algorithm: rank
    include: [{
      entity: "Token",
      fields: [
        { name: "background" }, { name: "mouth" }, { name: "hat" }, { name: "fur" }, { name: "eyes" },  { name: "clothes" }, { name: "earring" } 
      ]
    }]
  )
```

>### On Relationships via `@derivedFrom` (from the docs)
>
>- Reverse lookups can be defined on an entity through the `@derivedFrom` field. This creates a virtual field on the entity that may be queried but cannot be set manually through the mappings API. Rather, it is derived from the relationship defined on the other entity. For such relationships, it rarely makes sense to store both sides of the relationship, and both indexing and query performance will be better when only one side is stored and the other is derived.
>- For one-to-many relationships, the relationship should always be stored on the 'one' side, and the 'many' side should always be derived. Storing the relationship this way, rather than storing an array of entities on the 'many' side, will result in dramatically better performance for both indexing and querying the subgraph. In general, storing arrays of entities should be avoided as much as is practical.

we can now generate the entities locally to start using in the `mappings` created by the CLI:

```sh
graph codegen
```

### Update the subgraph with the entities and its mappings by configuring the **subgraph.yaml**

1. Update the `dataSources.mapping.entities` field with the `User` and `Token` entities:

2. Update the `dataSources.mapping.eventHandlers` to include only the **transfer event**

> The important event is the **transfer event** and we're only going to  be indexing that event because it actually gives us a lot of functionality out of the box. Because its called every time a new nft is minted or when an nft is transferred or when an nft is sold so this allows us to index all the nfts as they're created and as they're changing ownership between the different users.

3. Update the `dataSources.source` to add the `startBlock`(Go to the last transaction and add that block as the startBlock).

>This will allow us to define when this this subgraph starts to index so we don't have to start from the genesis block of ethereum

This is how the final subgraph.yaml will look like

```graphql
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: Token
    network: mainnet
    source:
      address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"
      abi: Token
      startBlock: 12287507
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.5
      language: wasm/assemblyscript
      entities:
        - Token
        - User
      abis:
        - name: Token
          file: ./abis/Token.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
      file: ./src/token.ts
features:
  - fullTextSearch
  - ipfsOnEthereumContracts


```

### Assemblyscript mappings

The mappings will handle events for when a new token is created or transferred. When this event fires, the mappings will save the data into the subgraph.

In the **src/token.ts or src/mapping.ts** and update as follows:

```typescript
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
        token.createdAtTimestamp = event.block.timestamp;

        token.tokenURI = "/" + event.params.tokenId.toString()

        let metadata = ipfs.cat(ipfsHash + token.tokenURI);

        if (metadata) {
            const value = json.fromBytes(metadata).toObject();
            if (value) {
                const image = value.get('image');
                if (image) {
                    token.image = image.toString();
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

```

## Deploy the subgraph

1. Run the command `graph auth`

    ```bash
    ❯ graph auth
    ✔ Product for which to initialize · hosted-service
    ✔ Deploy key · ********************************
    Deploy key set for https://api.thegraph.com/deploy/

    ### to get the deploy key, go to the The graph dashboard(https://thegraph.com/hosted-service/dashboard) and copy the Access Token and paste it
    ```

2. Run the command `graph build`

    ```bash
    ❯ graph build
    Skip migration: Bump mapping apiVersion from 0.0.1 to 0.0.2
    Skip migration: Bump mapping apiVersion from 0.0.2 to 0.0.3
    Skip migration: Bump mapping apiVersion from 0.0.3 to 0.0.4
    Skip migration: Bump mapping apiVersion from 0.0.4 to 0.0.5
    Skip migration: Bump mapping apiVersion from 0.0.5 to 0.0.6
    Skip migration: Bump manifest specVersion from 0.0.1 to 0.0.2
    Skip migration: Bump manifest specVersion from 0.0.2 to 0.0.4
    ✔ Apply migrations
    ✔ Load subgraph from subgraph.yaml
    Compile data source: Token => build/Token/Token.wasm
    ✔ Compile subgraph
    Copy schema file build/schema.graphql
    Write subgraph file build/Token/abis/Token.json
    Write subgraph manifest build/subgraph.yaml
    ✔ Write compiled subgraph to build/

    Build completed: /home/dex/WorkSpace/Blockchain/bored-ape/build/subgraph.yaml
    ```

3. Run the command `yarn deploy`

    ```bash
    ❯ yarn deploy
    yarn run v1.22.17
    warning ../../../package.json: No license field
    $ graph deploy --node https://api.thegraph.com/deploy/ syamantak01/bored-ape
    Skip migration: Bump mapping apiVersion from 0.0.1 to 0.0.2
    Skip migration: Bump mapping apiVersion from 0.0.2 to 0.0.3
    Skip migration: Bump mapping apiVersion from 0.0.3 to 0.0.4
    Skip migration: Bump mapping apiVersion from 0.0.4 to 0.0.5
    Skip migration: Bump mapping apiVersion from 0.0.5 to 0.0.6
    Skip migration: Bump manifest specVersion from 0.0.1 to 0.0.2
    Skip migration: Bump manifest specVersion from 0.0.2 to 0.0.4
    ✔ Apply migrations
    ✔ Load subgraph from subgraph.yaml
    Compile data source: Token => build/Token/Token.wasm
    ✔ Compile subgraph
    Copy schema file build/schema.graphql
    Write subgraph file build/Token/abis/Token.json
    Write subgraph manifest build/subgraph.yaml
    ✔ Write compiled subgraph to build/
    Add file to IPFS build/schema.graphql
                    .. Qmbh3aZ4RqPZ1ny2ffyAByCgdZtnnpS6AEa63EW6NDj2WL
    Add file to IPFS build/Token/abis/Token.json
                    .. QmdAem1EX6epdEMvZW8wrtzFCiQCapJ3szPMqkh1mbdwho
    Add file to IPFS build/Token/Token.wasm
                    .. QmUff1N8pqHhxFLHyzMZ5AfLkJeKZXuAgukkKzQhwoHfFP
    ✔ Upload subgraph to IPFS

    Build completed: QmVV2wrisVnM4FiGewz8oMunPN6XzrxEuGaXQSuEn31pxr

    Deployed to https://thegraph.com/explorer/subgraph/syamantak01/bored-ape

    Subgraph endpoints:
    Queries (HTTP):     https://api.thegraph.com/subgraphs/name/syamantak01/bored-ape

    Done in 10.76s.
    ```

After deploying it, we can see the playground. (Access the playground from [The Graph dashboard](https://thegraph.com/hosted-service/dashboard))

![image](https://user-images.githubusercontent.com/58560802/172486646-fe3d2bed-dcd7-40a9-b54c-5543dc932159.png)

## Querying Data


## References

- https://thegraph.com/docs/en/
- https://youtu.be/VRK17Ai33Dw
- https://youtu.be/Y-4Rf6OX3YM