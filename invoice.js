  
        // Print functionality
        document.getElementById('printBtn').addEventListener('click', () => {
            window.print();
        });
        
        // Download PDF functionality (simulated)
        document.getElementById('downloadBtn').addEventListener('click', () => {
            // In a real application, this would generate and download a PDF
            // For demo purposes, we'll create a simple text file
            const invoiceContent = `
MEDIHOME INVOICE
================
Invoice #: #MH-2024-12346
Date: December 25, 2024
Time: 2:30 PM
Status: Paid & Confirmed

ORDERED BY:
Name: Md. Rahman
Phone: +880 1712 345678
Email: rahman@example.com
Address: 456 Main Street, Dhaka 1000

ORDER INFORMATION:
Order ID: ORD-724856
Payment: bKash
Transaction: TRX123456789
Status: Confirmed

PRODUCTS:
1. Paracetamol 500mg (SKU: PARA-500-100) - Qty: 2 - Price: ৳120 - Total: ৳240
2. Vitamin C 1000mg (SKU: VITC-1000-50) - Qty: 1 - Price: ৳450 - Total: ৳450
3. Cough Syrup (SKU: COUGH-200ML) - Qty: 1 - Price: ৳180 - Total: ৳180

PRICING:
Subtotal: ৳870
Delivery: ৳0
Discount (MED10): -৳87
VAT (5%): ৳39.15
Total: ৳822.15

Amount in Words: Eight Hundred Twenty Two Taka and Fifteen Paisa Only

SPECIAL INSTRUCTIONS:
Please deliver between 10:00 AM to 12:00 PM. Call before delivery. Patient is allergic to penicillin. Please ensure all medicines are within expiry date.

TERMS & CONDITIONS:
1. All medicines are genuine and sourced from authorized distributors.
2. Once delivered, medicines cannot be returned or exchanged.
3. Please check the expiry date before consuming any medicine.
4. Keep medicines out of reach of children.
5. Consult your doctor before taking any medicine.
6. MediHome is not responsible for any adverse effects from medicines.
            `;
            
            const blob = new Blob([invoiceContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice-MH-2024-12346.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
        // Email functionality (simulated)
        document.getElementById('emailBtn').addEventListener('click', () => {
            // In a real application, this would open an email client or send via API
            alert('Invoice would be emailed to rahman@example.com');
        });
    document.addEventListener("DOMContentLoaded", () => {
  const alerts = document.querySelectorAll(".flash-messages .alert");

  alerts.forEach((alert, i) => {
    // ছোট delay দিয়ে দেখাও
    setTimeout(() => {
      alert.classList.add("show");
    }, i * 150);

    // 2 সেকেন্ড পর hide করো
    setTimeout(() => {
      alert.classList.remove("show");
      alert.classList.add("hide");
      // animation শেষে DOM থেকে remove
      setTimeout(() => alert.remove(), 500);
    }, 2000 + i * 150);
  });
});
