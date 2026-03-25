<?php

namespace App\Mail;

use App\Models\Payslip;
use App\Services\PayslipPDF;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class PayslipMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Payslip $payslip) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Payslip — {$this->payslip->period->label} — Blue Lotus Hotel",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'payslips.email',
            with: [
                'employeeName' => $this->payslip->employee->full_name,
                'periodLabel'  => $this->payslip->period->label,
                'netPay'       => $this->payslip->net_pay,
                'grossPay'     => $this->payslip->gross_pay,
            ],
        );
    }

    public function attachments(): array
    {
        // Generate PDF on the fly and attach
        $pdfContent = PayslipPDF::generate($this->payslip)->output();
        $filename   = PayslipPDF::getFilename($this->payslip);

        return [
            Attachment::fromData(fn () => $pdfContent, $filename)
                ->withMime('application/pdf'),
        ];
    }
}