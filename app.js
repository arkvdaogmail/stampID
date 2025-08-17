require('dotenv').config();
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { ThorClient, VeChainProvider } = require('@vechain/sdk-network');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/', 'text/plain'];
    if (allowedTypes.some(type => file.mimetype.includes(type))) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, images, and text files allowed'));
    }
  }
});

const thor = ThorClient.at('https://testnet.vechain.org/');
const vechain = new VeChainProvider(thor);

const hashFile = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

app.post('/notarize', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const documentHash = hashFile(req.file.buffer);
    const txData = `0x${Buffer.from(`Notarized:${documentHash}`).toString('hex')}`;
    
    const txResponse = await vechain.transactions.sendTransaction(
      {
        from: process.env.VECHAIN_ADDRESS,
        to: process.env.VECHAIN_ADDRESS,
        value: 0,
        data: txData,
      },
      process.env.VECHAIN_PRIVATE_KEY
    );

    res.json({
      success: true,
      documentHash,
      vechainTx: txResponse.id,
      explorerUrl: `https://explore-testnet.vechain.org/transactions/${txResponse.id}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Notarization failed', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
