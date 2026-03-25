<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * IMMUTABLE — never update or delete rows in this table.
 *
 * @property int         $id
 * @property string      $entity_type
 * @property int         $entity_id
 * @property string      $action
 * @property int         $performed_by
 * @property array|null  $before_values
 * @property array|null  $after_values
 * @property string|null $description
 * @property string|null $ip_address
 */
class PayrollAuditLog extends Model
{
    // No updated_at — this table is append-only
    const UPDATED_AT = null;

    protected $fillable = [
        'entity_type', 'entity_id', 'action',
        'performed_by', 'before_values', 'after_values',
        'description', 'ip_address',
    ];

    protected $casts = [
        'before_values' => 'array',
        'after_values'  => 'array',
    ];

    // ─── Override to prevent updates ──────────────────────────────────────────

    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new \Exception('PayrollAuditLog records are immutable and cannot be updated.');
        }
        return parent::save($options);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    // ─── Factory method — always use this to create logs ─────────────────────

    public static function record(
        string $entityType,
        int    $entityId,
        string $action,
        int    $performedBy,
        array  $beforeValues = [],
        array  $afterValues  = [],
        string $description  = '',
        ?string $ipAddress   = null
    ): self {
        return self::create([
            'entity_type'    => $entityType,
            'entity_id'      => $entityId,
            'action'         => $action,
            'performed_by'   => $performedBy,
            'before_values'  => $beforeValues ?: null,
            'after_values'   => $afterValues ?: null,
            'description'    => $description ?: null,
            'ip_address'     => $ipAddress,
        ]);
    }
}