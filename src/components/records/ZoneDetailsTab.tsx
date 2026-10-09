import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  Server, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { HostedZone, DnsRecord } from '../../types/route53';

interface ZoneDetailsTabProps {
  zone: HostedZone;
  records: DnsRecord[];
  onEditZone: () => void;
  showToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
}

export const ZoneDetailsTab: React.FC<ZoneDetailsTabProps> = ({
  zone,
  records,
  onEditZone,
  showToast,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast({
      type: 'info',
      title: 'Copied to clipboard',
      message: text,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Find NS and SOA records
  const nsRecord = records.find((r) => r.type === 'NS');
  const soaRecord = records.find((r) => r.type === 'SOA');

  const nameservers = nsRecord
    ? nsRecord.value.split('\n').map((ns) => ns.trim()).filter(Boolean)
    : [
        'ns-1536.awsdns-00.org.',
        'ns-0.awsdns-00.com.',
        'ns-1024.awsdns-00.co.uk.',
        'ns-512.awsdns-00.net.'
      ];

  const isPrivate = zone.private_zone === 1 || zone.zone_type === 'Private';

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* General Details Card */}
        <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
            <h3 className="font-bold text-xs text-[#16191f] uppercase tracking-wider">
              Hosted zone details
            </h3>
            <button
              onClick={onEditZone}
              className="text-[#0073bb] hover:underline flex items-center space-x-1 text-xs"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[#687078] text-[11px]">Domain name</p>
              <p className="font-bold text-[#16191f] mt-0.5">{zone.name}</p>
            </div>

            <div>
              <p className="text-[#687078] text-[11px]">Type</p>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 mt-0.5 rounded text-[11px] font-medium border ${
                  isPrivate
                    ? 'bg-[#f2f3f3] text-[#545b64] border-[#eaeded]'
                    : 'bg-[#f2f8f0] text-[#1d8102] border-[#1d8102]/20'
                }`}
              >
                {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                <span>{zone.zone_type} hosted zone</span>
              </span>
            </div>

            <div>
              <p className="text-[#687078] text-[11px]">Hosted zone ID</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-mono text-[#16191f] bg-[#f8f9fa] px-1.5 py-0.5 rounded border border-[#eaeded]">
                  {zone.zone_id}
                </span>
                <button
                  onClick={() => copyToClipboard(zone.zone_id, 'zone_id')}
                  className="text-[#687078] hover:text-[#16191f] p-1 rounded hover:bg-[#eaeded]"
                  title="Copy Zone ID"
                >
                  {copiedField === 'zone_id' ? <Check className="w-3 h-3 text-[#1d8102]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[#687078] text-[11px]">Record count</p>
              <p className="font-bold text-[#16191f] mt-0.5">{zone.record_count}</p>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <p className="text-[#687078] text-[11px]">Description / Comment</p>
              <p className="text-[#16191f] mt-0.5 text-xs italic">
                {zone.description || 'No description provided'}
              </p>
            </div>

            <div>
              <p className="text-[#687078] text-[11px]">Created at</p>
              <p className="text-[#16191f] mt-0.5 text-[11px]">
                {zone.created_at ? new Date(zone.created_at).toLocaleString() : '-'}
              </p>
            </div>

            <div>
              <p className="text-[#687078] text-[11px]">Status</p>
              <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>INSYNC</span>
              </span>
            </div>
          </div>
        </div>

        {/* Name Servers Card */}
        <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#ec7211]" />
              <h3 className="font-bold text-xs text-[#16191f] uppercase tracking-wider">
                Name servers
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(nameservers.join('\n'), 'all_ns')}
              className="text-[#0073bb] hover:underline flex items-center space-x-1 text-xs"
            >
              {copiedField === 'all_ns' ? <Check className="w-3 h-3 text-[#1d8102]" /> : <Copy className="w-3 h-3" />}
              <span>Copy all</span>
            </button>
          </div>

          <p className="text-[11px] text-[#687078]">
            Configure these 4 authoritative name servers at your domain registrar to delegate DNS traffic to this hosted zone:
          </p>

          <div className="space-y-1.5 bg-[#f8f9fa] border border-[#eaeded] p-3 rounded font-mono text-xs">
            {nameservers.map((ns, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <span className="text-[#16191f]">{ns}</span>
                <button
                  onClick={() => copyToClipboard(ns, `ns_${idx}`)}
                  className="opacity-0 group-hover:opacity-100 text-[#687078] hover:text-[#16191f] p-0.5 rounded transition-opacity"
                  title="Copy nameserver"
                >
                  {copiedField === `ns_${idx}` ? <Check className="w-3 h-3 text-[#1d8102]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>

          {soaRecord && (
            <div className="pt-2 border-t border-[#eaeded]">
              <p className="text-[#687078] text-[11px] font-semibold">SOA (Start of Authority) record</p>
              <p className="font-mono text-[11px] text-[#545b64] mt-1 break-all bg-[#fafafa] p-2 rounded border border-[#eaeded]">
                {soaRecord.value}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Associated VPCs Card if Private */}
      {isPrivate && (
        <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm p-4 space-y-3">
          <h3 className="font-bold text-xs text-[#16191f] uppercase tracking-wider pb-2 border-b border-[#eaeded]">
            Associated Virtual Private Clouds (VPCs)
          </h3>
          <p className="text-[11px] text-[#687078]">
            Traffic from EC2 instances within these VPCs resolves DNS queries using this private hosted zone.
          </p>
          <div className="border border-[#eaeded] rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <tr>
                  <th className="py-2 px-3 text-left">VPC ID</th>
                  <th className="py-2 px-3 text-left">VPC Region</th>
                  <th className="py-2 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[#0073bb]">vpc-0a1b2c3d4e5f6g7h8</td>
                  <td className="py-2.5 px-3">us-east-1 (N. Virginia)</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-semibold">Associated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
