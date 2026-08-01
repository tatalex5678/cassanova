import { Schema, model, Document } from 'mongoose';

// Define the TypeScript interface for our database document
interface IHouseWallet extends Document {
    vaultName: string;
    totalRevenue: number;
    totalPlayerLosses: number;
    totalPlayerPayouts: number;
}

// Create the MongoDB Schema structure
const HouseWalletSchema = new Schema<IHouseWallet>({
    vaultName: { 
        type: String, 
        default: "Cassanova_Main_Vault",
        unique: true // Ensures only one master vault can ever exist
    },
    totalRevenue: { 
        type: Number, 
        default: 100000 // Starting seed balance for the house pool
    },
    totalPlayerLosses: { 
        type: Number, 
        default: 0 
    },
    totalPlayerPayouts: { 
        type: Number, 
        default: 0 
    }
});

// Export the model so it can be imported into game.routes.ts
export default model<IHouseWallet>('HouseWallet', HouseWalletSchema);