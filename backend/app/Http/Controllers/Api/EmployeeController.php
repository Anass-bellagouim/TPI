<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    /**
     * ✅ قواعد التحكم:
     * - Super Admin فقط يقدر يسير admins (delete/toggle/update/reset...).
     * - Admin عادي يقدر يسير users فقط.
     * - ما يمكنش self-delete ولا self-deactivate.
     */
    private function actor(): User
    {
        /** @var User $u */
        $u = auth()->user();
        return $u;
    }

    private function assertCanManageTarget(User $target, string $action): void
    {
        $actor = $this->actor();

        // Safety: خاص routes تكون تحت middleware admin
        if (!$actor->isAdmin()) {
            abort(403, 'Forbidden.');
        }

        // منع أي action على راسك فـ delete/toggle
        if (in_array($action, ['delete', 'toggle_active'], true) && $actor->id === $target->id) {
            abort(403, 'You cannot perform this action on your own account.');
        }

        // إذا target هو super admin: غير super admin يقدر يمسو
        if (method_exists($target, 'isSuperAdmin') && $target->isSuperAdmin()) {
            if (!method_exists($actor, 'isSuperAdmin') || !$actor->isSuperAdmin()) {
                abort(403, 'You cannot manage the super admin account.');
            }
        }

        // إذا target هو admin:
        // - غير super admin يقدر يسير admins
        if ($target->role === 'admin') {
            if (!method_exists($actor, 'isSuperAdmin') || !$actor->isSuperAdmin()) {
                abort(403, 'Only super admin can manage admin accounts.');
            }
        }
    }

    // GET /api/admin/employees?search=&per_page=
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        // ✅ per_page from query (allowed values only)
        $perPage = (int) $request->query('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $q = User::query()
            ->select([
                'id',
                'first_name',
                'last_name',
                'username',
                'email',
                'role',
                'is_active',
                'is_super_admin', // ✅ NEW (باش UI تعرف شكون سوبر)
            ]);

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $page = $q->orderByDesc('id')->paginate($perPage);

        $page->getCollection()->transform(function (User $u) {
            return $this->shapeUser($u);
        });

        return response()->json($page);
    }

    // POST /api/admin/employees
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'username'   => ['required', 'string', 'max:255', 'unique:users,username'],

            // email nullable عامة
            'email'      => ['nullable', 'email', 'max:255', 'unique:users,email'],

            'role'       => ['required', Rule::in(['admin', 'user'])],

            // password nullable هنا (غادي نفرضه حسب role)
            'password'   => ['nullable', 'string', 'min:6', 'confirmed'],

            'is_active'  => ['sometimes', 'boolean'],
        ]);

        // rules by role
        if (($data['role'] ?? null) === 'admin') {
            if (empty($data['email'])) {
                return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
            }
            if (empty($data['password'])) {
                return response()->json(['message' => 'كلمة المرور إجباريّة للـ admin.'], 422);
            }
        }

        if (($data['role'] ?? null) === 'user') {
            // user: بلا email
            $data['email'] = null;

            // default password إذا ما تعطاتش
            if (empty($data['password'])) {
                $data['password'] = '123456';
            }
        }

        $u = new User();
        $u->first_name = $data['first_name'];
        $u->last_name  = $data['last_name'];
        $u->username   = $data['username'];
        $u->email      = $data['email'] ?? null;
        $u->role       = $data['role'];
        $u->password   = Hash::make($data['password']);
        $u->is_active  = array_key_exists('is_active', $data) ? (bool)$data['is_active'] : true;

        // ✅ مهم: أي admin جديد ماشي super admin
        if (property_exists($u, 'is_super_admin') || array_key_exists('is_super_admin', $u->getAttributes())) {
            $u->is_super_admin = false;
        }

        $u->save();

        return response()->json([
            'message' => 'تم إنشاء الموظف بنجاح',
            'data' => $this->shapeUser($u),
        ], 201);
    }

    // GET /api/admin/employees/{user}
    public function show(User $user)
    {
        // show مسموح حتى على admin (غير read)
        return response()->json([
            'data' => $this->shapeUser($user),
        ]);
    }

    // PATCH /api/admin/employees/{user}
    public function update(Request $request, User $user)
    {
        // ✅ منع تعديل admins من غير super admin
        $this->assertCanManageTarget($user, 'update');

        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name'  => ['sometimes', 'string', 'max:255'],
            'username'   => ['sometimes', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email'      => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role'       => ['sometimes', Rule::in(['admin', 'user'])],
            'is_active'  => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('first_name', $data)) $user->first_name = $data['first_name'];
        if (array_key_exists('last_name', $data))  $user->last_name  = $data['last_name'];
        if (array_key_exists('username', $data))   $user->username   = $data['username'];

        // role update
        if (array_key_exists('role', $data)) {
            // ✅ super admin ما يتبدلش role ديالو (حماية إضافية)
            if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
                return response()->json(['message' => 'لا يمكن تغيير role ديال super admin.'], 403);
            }

            $user->role = $data['role'];
        }

        /**
         * email rules:
         * - user => null دائماً
         * - admin => email لازم
         */
        if (($user->role ?? null) === 'user') {
            $user->email = null;
        } else {
            // admin: إذا جا email فـ request
            if (array_key_exists('email', $data)) {
                if (empty($data['email'])) {
                    return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
                }
                $user->email = $data['email'];
            }

            // إذا تبدل role ل admin وما عندوش email أصلاً
            if (empty($user->email)) {
                return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
            }
        }

        // is_active update:
        // - إذا target admin: أصلاً ما وصلناش هنا إلا super admin
        if (array_key_exists('is_active', $data)) {
            $user->is_active = (bool) $data['is_active'];

            // revoke tokens إذا تقفل
            if (!$user->is_active && method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
        }

        $user->save();

        return response()->json([
            'message' => 'تم تحديث الموظف بنجاح',
            'data' => $this->shapeUser($user),
        ]);
    }

    /**
     * PATCH /api/admin/employees/{user}/password
     * Reset default password = 123456 + revoke tokens
     */
    public function resetPassword(Request $request, User $user)
    {
        // ✅ نفس القاعدة: admin accounts غير super admin يقدر يمسهم
        $this->assertCanManageTarget($user, 'reset_password');

        // إذا هو admin وماشي super admin: نقدر نخليه مسموح غير للسوبر (assert دارها)
        // لكن بقا عندك الرفض القديم: "لا يمكن إعادة تعيين كلمة مرور admin من هنا."
        // هذا كيمنع حتى السوبر. إذا بغيتي السوبر يقدر، حيد هاد الشرط.
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'لا يمكن إعادة تعيين كلمة مرور admin من هنا.',
            ], 403);
        }

        $user->password = Hash::make('123456');
        $user->save();

        // revoke tokens (Sanctum)
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'تمت إعادة تعيين كلمة المرور',
        ]);
    }

    // PATCH /api/admin/employees/{user}/toggle-active
    public function toggleActive(User $user)
    {
        // ✅ منع toggle على admins إلا super admin
        $this->assertCanManageTarget($user, 'toggle_active');

        // بقا الشرط القديم: كان كيرفض admin نهائياً
        // دابا: user العادي مسموح، وadmin مسموح فقط للسوبر (assert)،
        // ولكن إذا بغيتي حتى السوبر ما يوقفش admin نهائياً، رجّع الشرط القديم.
        // هنا نخلي السوبر يقدر يوقف admin (حسب طلبك: غير admin الأول يقدر على أي admin آخر)
        $user->is_active = !$user->is_active;
        $user->save();

        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $user->is_active ? 'تم تفعيل الحساب بنجاح.' : 'تم توقيف الحساب بنجاح.',
            'data' => $this->shapeUser($user),
        ]);
    }

    // DELETE /api/admin/employees/{user}
    public function destroy(User $user)
    {
        // ✅ منع delete على admins إلا super admin + منع self-delete
        $this->assertCanManageTarget($user, 'delete');

        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        $user->delete();

        return response()->json(['message' => 'تم حذف الموظف بنجاح']);
    }

    /**
     * ✅ Formatter واحد للـ API
     */
    private function shapeUser(User $u): array
    {
        return [
            'id' => $u->id,
            'full_name' => $this->fullName($u),
            'first_name' => $u->first_name,
            'last_name' => $u->last_name,
            'username' => $u->username,
            'email' => $u->email,
            'role' => $u->role,
            'is_active' => (bool) ($u->is_active ?? true),

            // ✅ NEW (باش React تعرف واش تعرض actions ولا لا)
            'is_super_admin' => (bool) ($u->is_super_admin ?? false),
        ];
    }

    private function fullName(User $u): string
    {
        return trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
    }
}
