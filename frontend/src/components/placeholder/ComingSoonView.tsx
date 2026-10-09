import React from 'react';
import { 
  GitBranch, 
  Activity, 
  ShieldCheck, 
  Sliders, 
  ExternalLink, 
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

interface ComingSoonViewProps {
  featureId: 'traffic-policies' | 'health-checks' | 'resolver' | 'profiles' | 'dashboard';
  onNavigateToHostedZones: () => void;
}

const FEATURE_DATA = {
  dashboard: {
    title: 'Route 53 Dashboard',
    subtitle: 'Overview of Amazon Route 53 DNS resources, domains, health checks, and global traffic routing.',
    icon: Layers,
    badge: 'Overview',
    description: 'Amazon Route 53 is a highly available and scalable cloud Domain Name System (DNS) web service. It is designed to give developers and businesses an extremely reliable and cost effective way to route end users to Internet applications.',
    features: [
      'Manage public and private DNS hosted zones and record sets',
      'Configurable TTL and standard DNS record types (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA, SOA)',
      'Instant sync with SQLite persistence and Swagger REST API integration'
    ],
    ctaText: 'View Hosted Zones',
  },
  'traffic-policies': {
    title: 'Traffic policies',
    subtitle: 'Create sophisticated routing configurations using visual flowcharts and policy records.',
    icon: GitBranch,
    badge: 'Coming Soon',
    description: 'Traffic flow simplifies how you manage traffic globally using visual policy builder. You can combine latency routing, geolocation routing, failover routing, and weighted routing into complex multi-tier configurations.',
    features: [
      'Visual flowchart editor for DNS routing logic',
      'Multi-region failover and active-passive redundancy',
      'Geoproximity routing with AWS Local Zones and Outposts',
      'Policy versioning with zero downtime rollbacks'
    ],
    ctaText: 'Explore Hosted Zones',
  },
  'health-checks': {
    title: 'Health checks',
    subtitle: 'Monitor endpoints and cloud resources to trigger automatic DNS failover.',
    icon: Activity,
    badge: 'Coming Soon',
    description: 'Amazon Route 53 health checks monitor the health and performance of your web applications, web servers, and other resources. You can configure DNS failover based on endpoint health, CloudWatch alarms, or calculated health.',
    features: [
      'HTTP, HTTPS, and TCP endpoint monitoring from global edge locations',
      'Integration with Amazon CloudWatch alarms for automated alarms',
      'Calculated health checks combining multiple conditions',
      'Status notifications via Amazon SNS topics'
    ],
    ctaText: 'Manage Hosted Zones',
  },
  resolver: {
    title: 'Route 53 Resolver',
    subtitle: 'Hybrid cloud DNS resolution across VPCs and on-premises networks.',
    icon: ShieldCheck,
    badge: 'Coming Soon',
    description: 'Route 53 Resolver provides recursive DNS lookup for your Amazon VPCs, with DNS firewall filtering to block malicious domain names and exfiltration.',
    features: [
      'Inbound and outbound endpoints for hybrid connectivity with on-premises DNS',
      'DNS Firewall domain lists and inspection rules',
      'Resolver query logging to Amazon S3, CloudWatch Logs, or Kinesis',
      'VPC Route 53 Resolver rules and associations'
    ],
    ctaText: 'Go to Hosted Zones',
  },
  profiles: {
    title: 'Route 53 Profiles',
    subtitle: 'Manage and share DNS configurations across multiple AWS accounts and VPCs.',
    icon: Sliders,
    badge: 'Coming Soon',
    description: 'Route 53 Profiles let you group DNS configurations together, such as private hosted zone associations, resolver rules, and firewall rule groups, and share them across AWS accounts via AWS RAM.',
    features: [
      'Centralized DNS profile management across multiple AWS accounts',
      'Single-step association with multiple VPCs',
      'Integration with AWS Resource Access Manager (RAM)',
      'Automated inheritance of VPC DNS settings'
    ],
    ctaText: 'Return to Hosted Zones',
  },
};

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  featureId,
  onNavigateToHostedZones,
}) => {
  const data = FEATURE_DATA[featureId] || FEATURE_DATA['traffic-policies'];
  const Icon = data.icon;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto py-1 sm:py-2">
      {/* Header Banner */}
      <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-[#ebf3fc] text-[#0073bb] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#16191f] tracking-tight">{data.title}</h1>
                <span className="text-xs bg-[#eaeded] text-[#545b64] font-semibold px-2 py-0.5 rounded">
                  {data.badge}
                </span>
              </div>
              <p className="text-xs text-[#545b64] mt-1 max-w-2xl">{data.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onNavigateToHostedZones}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 sm:py-1.5 rounded-sm bg-[#ec7211] hover:bg-[#eb5f07] font-bold text-white text-xs transition-colors shrink-0"
          >
            <span>{data.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feature Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Details (2 cols) */}
        <div className="md:col-span-2 bg-white border border-[#eaeded] shadow-sm rounded-sm p-4 sm:p-6 space-y-4 text-xs">
          <h2 className="font-bold text-sm text-[#16191f]">Feature Overview</h2>
          <p className="text-[#545b64] leading-relaxed">{data.description}</p>

          <h3 className="font-bold text-xs text-[#16191f] pt-2">Planned Capabilities</h3>
          <ul className="space-y-2.5">
            {data.features.map((feat, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-[#545b64]">
                <CheckCircle className="w-4 h-4 text-[#1d8102] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-[#eaeded] flex items-center justify-between">
            <span className="text-[11px] text-[#879596]">
              Status: In development for future release
            </span>
            <button
              onClick={onNavigateToHostedZones}
              className="text-[#0073bb] font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Manage current hosted zones</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Resources & Info (1 col) */}
        <div className="bg-[#fafafa] border border-[#eaeded] shadow-sm rounded-sm p-6 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-[#16191f] font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-[#ec7211]" />
            <span>Documentation &amp; Resources</span>
          </div>

          <p className="text-[#687078] text-[11px]">
            Learn how Amazon Route 53 delivers highly reliable and scalable DNS services:
          </p>

          <div className="space-y-2">
            <a
              href="https://aws.amazon.com/route53/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2.5 bg-white border border-[#eaeded] rounded hover:border-[#aab7b8] transition-colors"
            >
              <div className="flex items-center justify-between font-semibold text-[#0073bb]">
                <span>AWS Route 53 Guide</span>
                <ExternalLink className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-[#687078] mt-1">Official AWS documentation on Route 53 concepts</p>
            </a>

            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2.5 bg-white border border-[#eaeded] rounded hover:border-[#aab7b8] transition-colors"
            >
              <div className="flex items-center justify-between font-semibold text-[#0073bb]">
                <span>FastAPI REST Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-[#687078] mt-1">Interactive Swagger UI testing endpoints</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
