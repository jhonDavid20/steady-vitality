import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IsString, IsOptional, IsJSON } from 'class-validator';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array',
}

export enum SettingCategory {
  GENERAL = 'general',
  SECURITY = 'security',
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  PAYMENT = 'payment',
  API = 'api',
  FEATURE = 'feature',
  LIMITS = 'limits',
  MAINTENANCE = 'maintenance',
}

@Entity('system_settings')
@Index(['key'], { unique: true })
@Index(['category'])
@Index(['isActive'])
@Index(['createdAt'])
export class SystemSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsString()
  key: string;

  @Column({ type: 'text' })
  @IsString()
  value: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({
    type: 'enum',
    enum: SettingType,
    default: SettingType.STRING,
  })
  type: SettingType;

  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.GENERAL,
  })
  category: SettingCategory;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isReadonly: boolean;

  @Column({ type: 'boolean', default: false })
  isSecret: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  validationRules?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Virtual properties
  get parsedValue(): any {
    try {
      switch (this.type) {
        case SettingType.BOOLEAN:
          return this.value.toLowerCase() === 'true';
        case SettingType.NUMBER:
          return parseFloat(this.value);
        case SettingType.JSON:
          return JSON.parse(this.value);
        case SettingType.ARRAY:
          return JSON.parse(this.value);
        default:
          return this.value;
      }
    } catch (error) {
      return this.value;
    }
  }

  get displayValue(): string {
    if (this.isSecret) {
      return '***';
    }
    return this.value;
  }

  // Instance methods
  setValue(value: any): void {
    switch (this.type) {
      case SettingType.BOOLEAN:
        this.value = Boolean(value).toString();
        break;
      case SettingType.NUMBER:
        this.value = Number(value).toString();
        break;
      case SettingType.JSON:
      case SettingType.ARRAY:
        this.value = JSON.stringify(value);
        break;
      default:
        this.value = String(value);
    }
  }

  validate(): boolean {
    if (!this.validationRules) return true;

    try {
      const rules = JSON.parse(this.validationRules);
      const value = this.parsedValue;

      // Basic validation rules
      if (rules.required && !value) return false;
      if (rules.minLength && String(value).length < rules.minLength) return false;
      if (rules.maxLength && String(value).length > rules.maxLength) return false;
      if (rules.min && Number(value) < rules.min) return false;
      if (rules.max && Number(value) > rules.max) return false;
      if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  resetToDefault(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
    }
  }

  toJSON(): Partial<SystemSettings> {
    const { value, ...settings } = this;
    return {
      ...settings,
      value: this.displayValue,
      parsedValue: this.parsedValue,
    };
  }

  // Static methods for common settings
  static async getSetting(key: string): Promise<SystemSettings | null> {
    return SystemSettings.findOne({ where: { key, isActive: true } });
  }

  static async getSettingValue(key: string, defaultValue?: any): Promise<any> {
    const setting = await SystemSettings.getSetting(key);
    return setting ? setting.parsedValue : defaultValue;
  }

  static async setSetting(key: string, value: any, updatedBy?: string): Promise<SystemSettings> {
    let setting = await SystemSettings.findOne({ where: { key } });
    
    if (setting) {
      if (setting.isReadonly) {
        throw new Error(`Setting '${key}' is readonly and cannot be modified`);
      }
      setting.setValue(value);
      setting.updatedBy = updatedBy;
    } else {
      setting = new SystemSettings();
      setting.key = key;
      setting.setValue(value);
      setting.updatedBy = updatedBy;
    }
    
    return setting.save();
  }

  static async getSettingsByCategory(category: SettingCategory): Promise<SystemSettings[]> {
    return SystemSettings.find({ 
      where: { category, isActive: true },
      order: { key: 'ASC' }
    });
  }

  // Default system settings
  static getDefaultSettings(): Partial<SystemSettings>[] {
    return [
      // General Settings
      {
        key: 'app.name',
        value: 'Steady Vitality',
        description: 'Application name',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        isReadonly: true,
      },
      {
        key: 'app.version',
        value: '1.0.0',
        description: 'Application version',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        isReadonly: true,
      },
      {
        key: 'app.maintenance_mode',
        value: 'false',
        description: 'Enable maintenance mode',
        type: SettingType.BOOLEAN,
        category: SettingCategory.MAINTENANCE,
      },
      
      // Security Settings
      {
        key: 'security.session_timeout_hours',
        value: '24',
        description: 'Session timeout in hours',
        type: SettingType.NUMBER,
        category: SettingCategory.SECURITY,
        defaultValue: '24',
      },
      {
        key: 'security.max_login_attempts',
        value: '5',
        description: 'Maximum login attempts before lockout',
        type: SettingType.NUMBER,
        category: SettingCategory.SECURITY,
        defaultValue: '5',
      },
      {
        key: 'security.password_min_length',
        value: '8',
        description: 'Minimum password length',
        type: SettingType.NUMBER,
        category: SettingCategory.SECURITY,
        defaultValue: '8',
      },
      
      // Email Settings
      {
        key: 'email.from_address',
        value: 'noreply@steadyvitality.com',
        description: 'Default from email address',
        type: SettingType.STRING,
        category: SettingCategory.EMAIL,
      },
      {
        key: 'email.smtp_host',
        value: '',
        description: 'SMTP server host',
        type: SettingType.STRING,
        category: SettingCategory.EMAIL,
        isSecret: true,
      },
      
      // Feature Flags
      {
        key: 'features.user_registration_enabled',
        value: 'true',
        description: 'Allow new user registration',
        type: SettingType.BOOLEAN,
        category: SettingCategory.FEATURE,
      },
      {
        key: 'features.email_verification_required',
        value: 'true',
        description: 'Require email verification for new accounts',
        type: SettingType.BOOLEAN,
        category: SettingCategory.FEATURE,
      },
      
      // Limits
      {
        key: 'limits.max_file_upload_size_mb',
        value: '10',
        description: 'Maximum file upload size in MB',
        type: SettingType.NUMBER,
        category: SettingCategory.LIMITS,
        defaultValue: '10',
      },
      {
        key: 'limits.max_clients_per_coach',
        value: '50',
        description: 'Maximum clients per coach',
        type: SettingType.NUMBER,
        category: SettingCategory.LIMITS,
        defaultValue: '50',
      },
    ];
  }
}