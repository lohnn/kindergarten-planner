class User {
  final int id;
  final String name;
  final String type; // 'primary' or 'occasional'

  const User({required this.id, required this.name, required this.type});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      name: json['name'] as String,
      type: json['type'] as String? ?? 'primary',
    );
  }

  bool get isPrimary => type == 'primary';
}
