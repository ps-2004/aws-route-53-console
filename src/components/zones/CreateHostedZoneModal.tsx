import React, { useState } from 'react';
import { X, Info, Globe, Lock, Loader2 } from 'lucide-react';
import { HostedZone } from '../../types/route53';

interface CreateHostedZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; description: string; zone_type: string; private_zone: boolean }) => Promise<void>;
  editZone?: HostedZone | null;
}

export const CreateHostedZoneModal: React.FC<CreateHostedZoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editZone,
}) => {
  const [domainName, setDomainName] = useState(editZone ? editZone.name : '');
  const [description, setDescription] = useState(editZone ? editZone.description : '');
  const [zoneType, setZoneType] = useState<'Public' | 'Private'>(
    editZone ? (editZone.private_zone ? 'Private' : 'Public') : 'Public'
  );
  const [vpcId, setVpcId] = useState('vpc-0a1b2c3d4e5f6g7h8 (default)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = domainName.trim();
    if (!trimmed) {
      setError('Domain name is required');
      return;
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(trimmed)) {
      setError('Please specify a valid domain name (e.g. example.com)');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: trimmed,
        description: description.trim(),
        zone_type: zoneType,
        private_zone: zoneType === 'Private',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create hosted zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-150">
      <div className="bg-white border border-[#eaeded] shadow-2xl rounded-sm w-full max-w-2xl text-xs overflow-hidden max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
          <div>
            <h2 className="font-bold text-sm text-[#16191f]">
              {editZone ? 'Edit hosted zone' : 'Create hosted zone'}
            </h2>
            <p className="text-[#687078] text-[11px] mt-0.5">
              A hosted zone tells Route 53 how to route traffic for a domain and subdomains.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#687078] hover:text-[#16191f] p-1 rounded hover:bg-[#eaeded] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-[#fdf2f2] border-l-4 border-l-[#d13212] border border-[#eaeded] rounded-sm text-[#d13212]">
              {error}
            </div>
          )}

          {/* Domain name field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[#16191f] font-bold text-xs">
                Domain name <span className="text-[#d13212]">*</span>
              </label>
              <span className="text-[11px] text-[#687078]">Required</span>
            </div>
            <p className="text-[11px] text-[#687078]">
              The fully qualified domain name (FQDN), such as example.com.
            </p>
            <input
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              placeholder="example.com"
              disabled={!!editZone || loading}
              className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-2 text-xs text-[#16191f] outline-none disabled:bg-[#f2f3f3] font-mono"
              required
            />
          </div>

          {/* Description field */}
          <div className="space-y-1.5">
            <label className="block text-[#16191f] font-bold text-xs">
              Description <span className="text-[#687078] font-normal">- optional</span>
            </label>
            <p className="text-[11px] text-[#687078]">
              Any information that you want to include about the hosted zone (up to 256 characters).
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Primary production hosted zone"
              rows={2}
              maxLength={256}
              disabled={loading}
              className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none"
            />
          </div>

          {/* Type Selector (Public vs Private) */}
          <div className="space-y-2 pt-1">
            <label className="block text-[#16191f] font-bold text-xs">
              Type <span className="text-[#d13212]">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Public Zone Card */}
              <label
                className={`border rounded p-3 flex items-start space-x-3 cursor-pointer transition-colors ${
                  zoneType === 'Public'
                    ? 'border-[#0073bb] bg-[#ebf3fc]/40'
                    : 'border-[#eaeded] hover:border-[#aab7b8]'
                }`}
              >
                <input
                  type="radio"
                  name="zone_type"
                  checked={zoneType === 'Public'}
                  onChange={() => setZoneType('Public')}
                  disabled={loading}
                  className="mt-0.5 text-[#0073bb]"
                />
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-[#16191f]">
                    <Globe className="w-3.5 h-3.5 text-[#0073bb]" />
                    <span>Public hosted zone</span>
                  </div>
                  <p className="text-[11px] text-[#545b64] leading-relaxed">
                    Determines how traffic is routed on the Internet. Accessible by any internet user.
                  </p>
                </div>
              </label>

              {/* Private Zone Card */}
              <label
                className={`border rounded p-3 flex items-start space-x-3 cursor-pointer transition-colors ${
                  zoneType === 'Private'
                    ? 'border-[#0073bb] bg-[#ebf3fc]/40'
                    : 'border-[#eaeded] hover:border-[#aab7b8]'
                }`}
              >
                <input
                  type="radio"
                  name="zone_type"
                  checked={zoneType === 'Private'}
                  onChange={() => setZoneType('Private')}
                  disabled={loading}
                  className="mt-0.5 text-[#0073bb]"
                />
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-[#16191f]">
                    <Lock className="w-3.5 h-3.5 text-[#545b64]" />
                    <span>Private hosted zone</span>
                  </div>
                  <p className="text-[11px] text-[#545b64] leading-relaxed">
                    Determines how traffic is routed within one or more Amazon Virtual Private Clouds (VPCs).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* VPC info if Private */}
          {zoneType === 'Private' && (
            <div className="bg-[#f8f9fa] border border-[#eaeded] p-3 rounded space-y-2">
              <label className="block text-[#16191f] font-semibold text-xs">
                VPC to associate with this hosted zone
              </label>
              <select
                value={vpcId}
                onChange={(e) => setVpcId(e.target.value)}
                disabled={loading}
                className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none bg-white font-mono"
              >
                <option value="vpc-0a1b2c3d4e5f6g7h8 (default)">vpc-0a1b2c3d4e5f6g7h8 | Default VPC (us-east-1)</option>
                <option value="vpc-0987654321fedcba0 (production)">vpc-0987654321fedcba0 | Production VPC (us-east-1)</option>
                <option value="vpc-01122334455667788 (staging)">vpc-01122334455667788 | Staging VPC (us-east-2)</option>
              </select>
            </div>
          )}

          {/* Notice box */}
          <div className="flex items-start space-x-2.5 p-3 bg-[#f0f7fb] border-l-4 border-l-[#0073bb] text-[#16191f] text-[11px] rounded-sm">
            <Info className="w-4 h-4 text-[#0073bb] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              When you create a hosted zone, Amazon Route 53 automatically creates a name server (NS) record and a start of authority (SOA) record for the zone.
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#eaeded] bg-[#fafafa] flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-1.5 rounded-sm border border-[#545b64] text-[#16191f] font-semibold hover:bg-[#eaeded] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-1.5 rounded-sm font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:bg-[#ec7211]/50 transition-colors flex items-center space-x-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{editZone ? 'Save changes' : 'Create hosted zone'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
