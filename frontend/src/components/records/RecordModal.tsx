import React, { useState, useEffect } from 'react';
import { X, Info, Loader2, Sparkles } from 'lucide-react';
import { DnsRecord, HostedZone, RecordType } from '../../types/route53';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: HostedZone;
  onSubmit: (payload: Partial<DnsRecord>) => Promise<void>;
  editRecord?: DnsRecord | null;
}

const RECORD_TYPE_CONFIGS: Record<RecordType, { title: string; description: string; example: string }> = {
  A: {
    title: 'A – Routes traffic to an IPv4 address',
    description: 'An IPv4 address in dotted decimal notation, for example, 192.0.2.1.',
    example: '192.168.1.10',
  },
  AAAA: {
    title: 'AAAA – Routes traffic to an IPv6 address',
    description: 'An IPv6 address in colon-separated format, for example, 2001:0db8:85a3::8a2e:0370:7334.',
    example: '2001:db8::1',
  },
  CNAME: {
    title: 'CNAME – Canonical name / alias for another domain name',
    description: 'The domain name that you want to resolve to instead of this record name.',
    example: 'example.com',
  },
  TXT: {
    title: 'TXT – Contains text characters (SPF, DKIM, verification)',
    description: 'A text string enclosed in double quotation marks, for example, "v=spf1 include:example.com ~all".',
    example: '"v=spf1 include:_spf.google.com ~all"',
  },
  MX: {
    title: 'MX – Mail exchange server that receives mail for a domain',
    description: 'A priority integer followed by the domain name of the mail server.',
    example: 'mail.example.com',
  },
  NS: {
    title: 'NS – Name servers for the hosted zone or delegation',
    description: 'Domain names of the authoritative name servers for this zone or subdomain.',
    example: 'ns-1.awsdns-00.org.',
  },
  PTR: {
    title: 'PTR – Pointer record used for reverse DNS lookups',
    description: 'The domain name that corresponds to the IP address.',
    example: 'host.example.com',
  },
  SRV: {
    title: 'SRV – Service locator record for services like SIP or LDAP',
    description: 'Priority, weight, port, and target host for the service.',
    example: 'sip.example.com',
  },
  CAA: {
    title: 'CAA – Certification Authority Authorization',
    description: 'Specifies which certificate authorities are allowed to issue certificates for the domain.',
    example: 'amazon.com',
  },
  SOA: {
    title: 'SOA – Start of authority record',
    description: 'Core metadata for DNS zone delegation and TTL configuration.',
    example: 'ns-1.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400',
  },
};

const TTL_PRESETS = [
  { label: '60s (1 min)', value: 60 },
  { label: '300s (5 mins - standard)', value: 300 },
  { label: '3600s (1 hour)', value: 3600 },
  { label: '86400s (1 day)', value: 86400 },
];

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  zone,
  onSubmit,
  editRecord,
}) => {
  // Form fields
  const [recordName, setRecordName] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [ttl, setTtl] = useState(300);
  const [value, setValue] = useState('');
  
  // MX specific
  const [priority, setPriority] = useState<number | ''>(10);

  // SRV specific
  const [srvPriority, setSrvPriority] = useState<number | ''>(10);
  const [srvWeight, setSrvWeight] = useState<number | ''>(60);
  const [srvPort, setSrvPort] = useState<number | ''>(5060);
  const [srvTarget, setSrvTarget] = useState('');

  // CAA specific
  const [caaFlags, setCaaFlags] = useState<number | ''>(0);
  const [caaTag, setCaaTag] = useState('issue');
  const [caaValue, setCaaValue] = useState('amazon.com');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editRecord) {
      // Subdomain extraction
      let sub = editRecord.name;
      if (sub === zone.name) {
        sub = '';
      } else if (sub.endsWith(`.${zone.name}`)) {
        sub = sub.slice(0, -(zone.name.length + 1));
      }

      setRecordName(sub);
      setRecordType(editRecord.type);
      setTtl(editRecord.ttl || 300);
      setValue(editRecord.value || '');
      setPriority(editRecord.priority !== null && editRecord.priority !== undefined ? editRecord.priority : 10);
      setSrvPriority(editRecord.priority !== null && editRecord.priority !== undefined ? editRecord.priority : 10);
      setSrvWeight(editRecord.weight !== null && editRecord.weight !== undefined ? editRecord.weight : 60);
      setSrvPort(editRecord.port !== null && editRecord.port !== undefined ? editRecord.port : 5060);
      setSrvTarget(editRecord.target || editRecord.value || '');
      setCaaFlags(editRecord.flags !== null && editRecord.flags !== undefined ? editRecord.flags : 0);
      setCaaTag(editRecord.tag || 'issue');
      setCaaValue(editRecord.value || 'amazon.com');
    } else {
      setRecordName('');
      setRecordType('A');
      setTtl(300);
      setValue('');
      setPriority(10);
      setSrvPriority(10);
      setSrvWeight(60);
      setSrvPort(5060);
      setSrvTarget('');
      setCaaFlags(0);
      setCaaTag('issue');
      setCaaValue('amazon.com');
    }
    setError(null);
  }, [editRecord, isOpen, zone.name]);

  if (!isOpen) return null;

  const fullDomainPreview = recordName.trim()
    ? `${recordName.trim()}.${zone.name}`
    : zone.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalValue = value.trim();

    // Field validations based on record type
    if (recordType === 'MX') {
      if (priority === '') {
        setError('Priority integer is required for MX records');
        return;
      }
      if (!finalValue) {
        setError('Mail server domain name is required');
        return;
      }
    } else if (recordType === 'SRV') {
      if (srvPriority === '' || srvWeight === '' || srvPort === '' || !srvTarget.trim()) {
        setError('Priority, Weight, Port, and Target host are all required for SRV records');
        return;
      }
      finalValue = srvTarget.trim();
    } else if (recordType === 'CAA') {
      if (caaFlags === '' || !caaValue.trim()) {
        setError('Flags and CAA value are required');
        return;
      }
      finalValue = caaValue.trim();
    } else if (recordType === 'TXT') {
      if (!finalValue) {
        setError('Text value is required');
        return;
      }
      // If user forgot double quotes on TXT, auto format with quotes
      if (!finalValue.startsWith('"') && !finalValue.endsWith('"')) {
        finalValue = `"${finalValue}"`;
      }
    } else {
      if (!finalValue) {
        setError('Record value is required');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Partial<DnsRecord> = {
        name: recordName.trim() || zone.name,
        type: recordType,
        ttl: Number(ttl) || 300,
        value: finalValue,
        routing_policy: 'Simple',
      };

      if (recordType === 'MX') {
        payload.priority = Number(priority);
      } else if (recordType === 'SRV') {
        payload.priority = Number(srvPriority);
        payload.weight = Number(srvWeight);
        payload.port = Number(srvPort);
        payload.target = srvTarget.trim();
      } else if (recordType === 'CAA') {
        payload.flags = Number(caaFlags);
        payload.tag = caaTag;
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-150">
      <div className="bg-white border border-[#eaeded] shadow-2xl rounded-sm w-full max-w-2xl text-xs overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
          <div>
            <h2 className="font-bold text-sm text-[#16191f]">
              {editRecord ? `Edit record (${editRecord.type})` : 'Create record'}
            </h2>
            <p className="text-[#687078] text-[11px] mt-0.5">
              Define routing rules for <span className="font-semibold text-[#16191f] font-mono">{zone.name}</span>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-[#fdf2f2] border-l-4 border-l-[#d13212] border border-[#eaeded] rounded-sm text-[#d13212]">
              {error}
            </div>
          )}

          {/* Record Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[#16191f] font-bold text-xs">
                Record name
              </label>
              <span className="text-[11px] text-[#687078]">Leave blank for apex/root domain</span>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value={recordName}
                onChange={(e) => setRecordName(e.target.value)}
                placeholder="subdomain (e.g. www, api, mail)"
                disabled={loading || (editRecord?.type === 'SOA')}
                className="flex-1 border border-r-0 border-[#aab7b8] focus:border-[#ec7211] rounded-l px-3 py-2 text-xs text-[#16191f] outline-none font-mono"
              />
              <span className="bg-[#f2f3f3] border border-[#aab7b8] px-3 py-2 rounded-r text-[#545b64] font-mono text-xs select-none">
                .{zone.name}
              </span>
            </div>
            <p className="text-[11px] text-[#687078] flex items-center space-x-1">
              <span>Resolves to:</span>
              <span className="font-mono font-semibold text-[#0073bb]">{fullDomainPreview}</span>
            </p>
          </div>

          {/* Record Type */}
          <div className="space-y-1.5">
            <label className="block text-[#16191f] font-bold text-xs">
              Record type <span className="text-[#d13212]">*</span>
            </label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as RecordType)}
              disabled={!!editRecord || loading}
              className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-2 text-xs text-[#16191f] outline-none bg-white font-mono"
            >
              <option value="A">A – Routes traffic to an IPv4 address</option>
              <option value="AAAA">AAAA – Routes traffic to an IPv6 address</option>
              <option value="CNAME">CNAME – Routes traffic to another domain name</option>
              <option value="TXT">TXT – Text string records (SPF, DKIM, TXT)</option>
              <option value="MX">MX – Specifies mail servers</option>
              <option value="NS">NS – Name server delegation</option>
              <option value="PTR">PTR – Pointer / reverse DNS lookup</option>
              <option value="SRV">SRV – Service record (priority, weight, port)</option>
              <option value="CAA">CAA – Certificate Authority Authorization</option>
              {editRecord?.type === 'SOA' && <option value="SOA">SOA – Start of authority</option>}
            </select>
            <p className="text-[11px] text-[#687078]">
              {RECORD_TYPE_CONFIGS[recordType]?.description}
            </p>
          </div>

          {/* Dynamic Fields based on Record Type */}
          <div className="bg-[#fafafa] border border-[#eaeded] p-3.5 rounded-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#eaeded]">
              <span className="font-bold text-xs text-[#16191f]">
                Value / Route traffic to
              </span>
              <span className="text-[11px] text-[#879596] font-mono">
                Type: {recordType}
              </span>
            </div>

            {/* A Record */}
            {recordType === 'A' && (
              <div className="space-y-1.5">
                <label className="block text-[#545b64] text-xs">
                  IPv4 address (e.g. 192.0.2.1)
                </label>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="192.168.1.10"
                  rows={2}
                  disabled={loading}
                  className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono bg-white"
                  required
                />
              </div>
            )}

            {/* AAAA Record */}
            {recordType === 'AAAA' && (
              <div className="space-y-1.5">
                <label className="block text-[#545b64] text-xs">
                  IPv6 address (e.g. 2001:0db8:85a3::8a2e:0370:7334)
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="2001:0db8:85a3::8a2e:0370:7334"
                  disabled={loading}
                  className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono bg-white"
                  required
                />
              </div>
            )}

            {/* CNAME Record */}
            {recordType === 'CNAME' && (
              <div className="space-y-1.5">
                <label className="block text-[#545b64] text-xs">
                  Target domain name (e.g. example.com or loadbalancer.us-east-1.elb.amazonaws.com)
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="example.com"
                  disabled={loading}
                  className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono bg-white"
                  required
                />
              </div>
            )}

            {/* TXT Record */}
            {recordType === 'TXT' && (
              <div className="space-y-1.5">
                <label className="block text-[#545b64] text-xs">
                  Text string (double quotes recommended)
                </label>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder='"v=spf1 include:example.com ~all"'
                  rows={2}
                  disabled={loading}
                  className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono bg-white"
                  required
                />
                <p className="text-[10px] text-[#879596]">Example: &quot;v=spf1 include:amazonses.com ~all&quot;</p>
              </div>
            )}

            {/* MX Record */}
            {recordType === 'MX' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#545b64] text-xs">Priority</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="10"
                    min="0"
                    max="65535"
                    disabled={loading}
                    className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono bg-white"
                    required
                  />
                  <p className="text-[10px] text-[#879596]">Lower = higher priority</p>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[#545b64] text-xs">Mail server host</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="mail.example.com"
                    disabled={loading}
                    className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono bg-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* SRV Record */}
            {recordType === 'SRV' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[#545b64] text-[11px]">Priority</label>
                    <input
                      type="number"
                      value={srvPriority}
                      onChange={(e) => setSrvPriority(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="10"
                      disabled={loading}
                      className="w-full border border-[#aab7b8] rounded px-2.5 py-1 text-xs font-mono bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[#545b64] text-[11px]">Weight</label>
                    <input
                      type="number"
                      value={srvWeight}
                      onChange={(e) => setSrvWeight(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="60"
                      disabled={loading}
                      className="w-full border border-[#aab7b8] rounded px-2.5 py-1 text-xs font-mono bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[#545b64] text-[11px]">Port</label>
                    <input
                      type="number"
                      value={srvPort}
                      onChange={(e) => setSrvPort(e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="5060"
                      disabled={loading}
                      className="w-full border border-[#aab7b8] rounded px-2.5 py-1 text-xs font-mono bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#545b64] text-xs">Target host</label>
                  <input
                    type="text"
                    value={srvTarget}
                    onChange={(e) => setSrvTarget(e.target.value)}
                    placeholder="bigbox.example.com"
                    disabled={loading}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-xs font-mono bg-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* CAA Record */}
            {recordType === 'CAA' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#545b64] text-xs">Flags</label>
                  <input
                    type="number"
                    value={caaFlags}
                    onChange={(e) => setCaaFlags(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="0"
                    disabled={loading}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-xs font-mono bg-white"
                    required
                  />
                  <p className="text-[10px] text-[#879596]">Usually 0</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#545b64] text-xs">Tag</label>
                  <select
                    value={caaTag}
                    onChange={(e) => setCaaTag(e.target.value)}
                    disabled={loading}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-xs font-mono bg-white"
                  >
                    <option value="issue">issue</option>
                    <option value="issuewild">issuewild</option>
                    <option value="iodef">iodef</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[#545b64] text-xs">Value</label>
                  <input
                    type="text"
                    value={caaValue}
                    onChange={(e) => setCaaValue(e.target.value)}
                    placeholder="amazon.com"
                    disabled={loading}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-xs font-mono bg-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* NS / PTR / SOA Records */}
            {(recordType === 'NS' || recordType === 'PTR' || recordType === 'SOA') && (
              <div className="space-y-1.5">
                <label className="block text-[#545b64] text-xs">
                  {recordType === 'NS' ? 'Name servers (one per line or space separated)' : 'Record value'}
                </label>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  rows={3}
                  disabled={loading}
                  className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono bg-white"
                  required
                />
              </div>
            )}
          </div>

          {/* TTL (Time To Live) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[#16191f] font-bold text-xs">
                TTL (Seconds)
              </label>
              <span className="text-[11px] text-[#687078]">How long resolvers cache this record</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="number"
                value={ttl}
                onChange={(e) => setTtl(Math.max(1, parseInt(e.target.value) || 300))}
                min="1"
                max="2147483647"
                disabled={loading}
                className="w-full sm:w-32 border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none font-mono"
                required
              />
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                {TTL_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setTtl(p.value)}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                      ttl === p.value
                        ? 'bg-[#ebf3fc] border-[#0073bb] text-[#0073bb] font-semibold'
                        : 'border-[#eaeded] hover:bg-[#eaeded] text-[#545b64]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Routing Policy */}
          <div className="space-y-1 pt-1">
            <label className="block text-[#16191f] font-bold text-xs">
              Routing policy
            </label>
            <div className="p-2.5 bg-[#f8f9fa] border border-[#eaeded] rounded flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#16191f]">Simple routing</p>
                <p className="text-[11px] text-[#687078]">
                  Routes traffic directly to a single resource (standard Route 53 behavior).
                </p>
              </div>
              <span className="text-[10px] bg-[#eaeded] text-[#545b64] font-semibold px-2 py-0.5 rounded">
                Standard
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
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
            <span>{editRecord ? 'Save changes' : 'Create records'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
