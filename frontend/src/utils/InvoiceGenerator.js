import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateInvoice = async (animal, soldRecord, farm) => {
  try {
    const invoiceNo = `GB-INV-${animal.tagNumber}-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;
    
    // Format date properly
    const dateObj = soldRecord.date ? new Date(soldRecord.date) : new Date();
    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    
    // Construct Farm Address String
    const addressParts = [];
    if (farm.address) addressParts.push(farm.address);
    if (farm.location) addressParts.push(farm.location);
    if (farm.city) addressParts.push(farm.city);
    if (farm.state) addressParts.push(farm.state);
    
    const addressStr = addressParts.join(', ') || 'Address not provided';
    
    const emailStr = farm.email ? `Email: ${farm.email}` : '';
    
    let phoneStr = '';
    if (farm.phones && farm.phones.length > 0) {
      phoneStr = `Mob.: ${farm.phones.join(', ')}`;
    } else if (farm.phone) {
      phoneStr = `Mob.: ${farm.phone}`;
    }

    const contactStr = [emailStr, phoneStr].filter(Boolean).join(' | ');
    
    let logoHtml = '<div class="software-name">Powered by GoatBook</div>';
    if (farm.logoUrl) {
      logoHtml = `<img src="${farm.logoUrl}" style="max-height: 80px; margin-bottom: 10px;" />`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #ea580c; /* Orange accent */
            padding-bottom: 20px;
          }
          .software-name {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          .farm-name {
            font-size: 32px;
            font-weight: bold;
            color: #ea580c;
            text-transform: uppercase;
            margin: 0 0 10px 0;
            letter-spacing: 1px;
          }
          .farm-details {
            font-size: 14px;
            color: #444;
            line-height: 1.5;
          }
          .farm-contact {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .meta-item {
            font-size: 15px;
          }
          .meta-label {
            font-weight: bold;
            color: #555;
          }
          
          .customer-details {
            margin-bottom: 30px;
            line-height: 2;
          }
          .customer-line {
            border-bottom: 1px solid #ccc;
            margin-top: 10px;
            min-height: 20px;
            display: flex;
          }
          .customer-label {
            width: 80px;
            font-weight: bold;
            color: #ea580c;
          }
          .customer-value {
            flex: 1;
            padding-left: 10px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f9fafb;
            color: #ea580c;
            text-align: left;
            padding: 12px;
            border: 1px solid #e5e7eb;
            font-weight: bold;
          }
          td {
            padding: 12px;
            border: 1px solid #e5e7eb;
            color: #333;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          
          .totals {
            width: 50%;
            float: right;
            margin-bottom: 50px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals-row.final {
            border-bottom: 2px solid #ea580c;
            font-weight: bold;
            font-size: 18px;
            color: #ea580c;
          }
          
          .footer {
            clear: both;
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .bank-details {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
          }
          .bank-title {
            font-weight: bold;
            color: #ea580c;
            margin-bottom: 5px;
            display: block;
          }
          .signature-area {
            text-align: right;
          }
          .signature-line {
            width: 200px;
            border-bottom: 1px solid #333;
            margin-bottom: 10px;
          }
          .signature-text {
            color: #ea580c;
            font-size: 14px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <h1 class="farm-name">${farm.name || 'FARM NAME'}</h1>
          <div class="farm-details">${addressStr}</div>
          <div class="farm-contact">${contactStr}</div>
        </div>
        
        <div class="meta-row">
          <div class="meta-item"><span class="meta-label">Invoice No:</span> ${invoiceNo}</div>
          <div class="meta-item"><span class="meta-label">Date:</span> ${dateStr}</div>
        </div>
        
        <div class="customer-details">
          <div class="customer-line">
            <div class="customer-label">Name:</div>
            <div class="customer-value"></div>
          </div>
          <div class="customer-line">
            <div class="customer-label">Address:</div>
            <div class="customer-value"></div>
          </div>
          <div class="customer-line">
            <div class="customer-label">Mob:</div>
            <div class="customer-value"></div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 10%">S.No.</th>
              <th style="width: 40%">Particulars</th>
              <th class="text-center" style="width: 15%">Qty/Wt.</th>
              <th class="text-right" style="width: 15%">Rate</th>
              <th class="text-right" style="width: 20%">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>
                <b>${animal.animalType || 'Animal'}</b> (Tag: ${animal.tagNumber})<br/>
                <small style="color: #666">Breed: ${animal.breed?.name || 'N/A'} | Gender: ${animal.gender || 'N/A'}</small>
              </td>
              <td class="text-center">${soldRecord.weight ? soldRecord.weight + ' KG' : '1'}</td>
              <td class="text-right">${soldRecord.price || '0.00'}</td>
              <td class="text-right">${soldRecord.netPrice || soldRecord.price || '0.00'}</td>
            </tr>
            <!-- Fill empty rows to make it look like a physical bill block -->
            <tr><td style="color:transparent">.</td><td></td><td></td><td></td><td></td></tr>
            <tr><td style="color:transparent">.</td><td></td><td></td><td></td><td></td></tr>
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${soldRecord.price || '0.00'}</span>
          </div>
          <div class="totals-row">
            <span>Discount</span>
            <span>${soldRecord.discount || '0.00'}</span>
          </div>
          <div class="totals-row final">
            <span>Total</span>
            <span>Rs. ${soldRecord.netPrice || soldRecord.price || '0.00'}</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="bank-details">
            <!-- Placeholder for bank details if needed -->
          </div>
          <div class="signature-area">
            <div class="signature-line"></div>
            <div class="signature-text">${farm.name || 'Authorized Signatory'}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share Invoice'
      });
    } else {
      console.warn("Sharing is not available on this device");
    }

    return true;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};
